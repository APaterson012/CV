#!/usr/bin/env python3

import os
import hashlib
import argparse
import json
import psutil
from datetime import datetime

try:
    import yara
    YARA_AVAILABLE = True
except ImportError:
    YARA_AVAILABLE = False

def compute_hash(filepath, algo="sha256"):
    hash_obj = hashlib.new(algo)
    try:
        with open(filepath, 'rb') as f:
            while chunk := f.read(8192):
                hash_obj.update(chunk)
        return hash_obj.hexdigest()
    except Exception:
        return None

def load_hashes(file_path):
    hashes = set()
    try:
        with open(file_path, 'r') as f:
            for line in f:
                hash_val = line.strip().lower()
                if hash_val:
                    hashes.add(hash_val)
    except FileNotFoundError:
        print(f"[!] Hash file not found: {file_path}")
    return hashes

def scan_file_yara(filepath, rules):
    try:
        matches = rules.match(filepath)
        return bool(matches)
    except:
        return False

def kill_process_by_path(path, stealth=False):
    for proc in psutil.process_iter(['pid', 'exe', 'name']):
        if proc.info['exe'] == path:
            try:
                proc.terminate()
                if not stealth:
                    print(f"[x] Terminated: {proc.info['name']} (PID {proc.pid})")
                return True
            except Exception:
                return False
    return False

def scan_paths(paths, hashes, yara_rules=None, whitelist=None, exclude=None,
               kill=False, stealth=False, log=False, algo="sha256"):

    results = []
    for path in paths:
        for root, dirs, files in os.walk(path):
            if exclude and any(x in root for x in exclude):
                continue
            for file in files:
                full_path = os.path.join(root, file)
                if whitelist and full_path in whitelist:
                    continue

                file_hash = compute_hash(full_path, algo)
                detected = False
                detection_type = None

                if file_hash in hashes:
                    detected = True
                    detection_type = f"{algo.upper()} hash"

                elif yara_rules and scan_file_yara(full_path, yara_rules):
                    detected = True
                    detection_type = "YARA"

                if detected:
                    info = {
                        "path": full_path,
                        "hash": file_hash,
                        "method": detection_type,
                        "time": datetime.utcnow().isoformat()
                    }
                    if not stealth:
                        print(f"[!] Malicious file: {full_path} ({detection_type})")

                    if kill:
                        info["killed"] = kill_process_by_path(full_path, stealth)

                    results.append(info)

    if log:
        with open("malwatch_log.json", "w") as f:
            json.dump(results, f, indent=2)
        if not stealth:
            print("[+] Results saved to malwatch_log.json")

    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Advanced Malware Scanner (Red Team Edition)")
    parser.add_argument("-p", "--paths", nargs="+", default=["/home"], help="Paths to scan")
    parser.add_argument("-m", "--malware", help="File with known malware hashes")
    parser.add_argument("-a", "--algo", choices=["md5", "sha1", "sha256"], default="sha256", help="Hashing algorithm")
    parser.add_argument("-y", "--yara", help="YARA rules file path")
    parser.add_argument("-e", "--exclude", nargs="*", help="Directories to exclude")
    parser.add_argument("-w", "--whitelist", help="File with list of safe files")
    parser.add_argument("-k", "--kill", action="store_true", help="Kill malicious processes")
    parser.add_argument("-s", "--stealth", action="store_true", help="Silent mode (no output)")
    parser.add_argument("-j", "--json", action="store_true", help="Log results to JSON")

    args = parser.parse_args()

    yara_rules = None
    if args.yara and YARA_AVAILABLE:
        try:
            yara_rules = yara.compile(filepath=args.yara)
        except Exception as e:
            print(f"[!] YARA compile error: {e}")

    whitelist = set()
    if args.whitelist:
        with open(args.whitelist, 'r') as f:
            whitelist = set(line.strip() for line in f)

    malware_hashes = load_hashes(args.malware) if args.malware else set()

    results = scan_paths(
        paths=args.paths,
        hashes=malware_hashes,
        yara_rules=yara_rules,
        whitelist=whitelist,
        exclude=args.exclude,
        kill=args.kill,
        stealth=args.stealth,
        log=args.json,
        algo=args.algo
    )
    if not args.stealth:
        print(f"[+] {len(results)} malicious file(s) detected.")
