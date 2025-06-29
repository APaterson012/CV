#!/usr/bin/env python3

import psutil
import time
import json
import argparse
import socket
import requests
from datetime import datetime

def load_blacklist(path):
    try:
        return set(line.strip() for line in open(path) if line.strip())
    except:
        return set()

def is_suspicious(ip, blacklist):
    return any(ip.startswith(entry) or ip == entry for entry in blacklist)

def geoip_lookup(ip):
    try:
        r = requests.get(f"http://ip-api.com/json/{ip}", timeout=2)
        data = r.json()
        return f"{data.get('countryCode')} - {data.get('org')}"
    except:
        return "Unknown"

def watch_connections(blacklist, log_file, stealth, geo):
    seen = set()
    while True:
        for conn in psutil.net_connections(kind='inet'):
            if conn.raddr and conn.status == 'ESTABLISHED':
                ip = conn.raddr.ip
                laddr = f"{conn.laddr.ip}:{conn.laddr.port}"
                raddr = f"{ip}:{conn.raddr.port}"

                if ip in seen:
                    continue
                seen.add(ip)

                try:
                    proc = psutil.Process(conn.pid)
                    proc_info = {
                        "pid": proc.pid,
                        "name": proc.name(),
                        "exe": proc.exe(),
                        "raddr": raddr,
                        "laddr": laddr,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                except:
                    proc_info = {
                        "pid": conn.pid,
                        "name": "N/A",
                        "exe": "N/A",
                        "raddr": raddr,
                        "laddr": laddr,
                        "timestamp": datetime.utcnow().isoformat()
                    }

                if is_suspicious(ip, blacklist):
                    proc_info["alert"] = True
                    proc_info["note"] = "Matched blacklist"
                else:
                    proc_info["alert"] = False

                if geo:
                    proc_info["geoip"] = geoip_lookup(ip)

                if not stealth:
                    status = "⚠️ ALERT" if proc_info["alert"] else "OK"
                    print(f"[{status}] {proc_info['name']} → {raddr} ({proc_info.get('geoip', '')})")

                if log_file:
                    with open(log_file, "a") as f:
                        f.write(json.dumps(proc_info) + "\n")

        time.sleep(5)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="netwatch.py – Real-Time Suspicious Connection Monitor")
    parser.add_argument("-b", "--blacklist", help="IP/CIDR blacklist file")
    parser.add_argument("-g", "--geoip", action="store_true", help="Enable GeoIP lookups")
    parser.add_argument("-l", "--log", help="Log suspicious activity to file (JSON lines)")
    parser.add_argument("-s", "--stealth", action="store_true", help="Run in silent mode")

    args = parser.parse_args()
    blacklist = load_blacklist(args.blacklist) if args.blacklist else set()

    watch_connections(blacklist, args.log, args.stealth, args.geoip)
