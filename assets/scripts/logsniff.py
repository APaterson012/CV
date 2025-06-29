#!/usr/bin/env python3

import re
import argparse
import time
import json
from datetime import datetime

# Default built-in patterns
BUILTIN_PATTERNS = {
    "SQL Injection": r"(\bUNION\b|\bSELECT\b|\bDROP\b|\bSLEEP\b|\bINSERT\b)",
    "Path Traversal": r"(\.\./|\.\.\\|%2e%2e)",
    "XSS": r"(<script>|%3Cscript%3E|<img src=|onerror=)",
    "Brute Force": r"(Failed password|authentication failure)",
    "Command Injection": r"(;|&&|\|\|)\s*\w+",
    "Suspicious User Agent": r"(sqlmap|nikto|nmap|curl|wget|python-requests)"
}

def load_custom_rules(file):
    rules = {}
    try:
        with open(file, 'r') as f:
            for line in f:
                if "::" in line:
                    name, pattern = line.strip().split("::", 1)
                    rules[name.strip()] = pattern.strip()
    except FileNotFoundError:
        print(f"[!] Custom rule file not found: {file}")
    return rules

def scan_line(line, line_no, rules):
    alerts = []
    for name, pattern in rules.items():
        if re.search(pattern, line, re.IGNORECASE):
            alerts.append({
                "time": datetime.utcnow().isoformat(),
                "line_number": line_no,
                "rule": name,
                "pattern": pattern,
                "log": line.strip()
            })
    return alerts

def scan_file(logfile, rules, output=None):
    print(f"[+] Scanning: {logfile}")
    results = []
    with open(logfile, 'r', errors='ignore') as f:
        for i, line in enumerate(f, 1):
            matches = scan_line(line, i, rules)
            results.extend(matches)
            for m in matches:
                print(f"[!] {m['rule']} on line {i}: {m['log']}")
    if output:
        with open(output, "w") as f:
            json.dump(results, f, indent=2)
        print(f"[+] Alerts saved to {output}")

def tail_log(logfile, rules, output=None):
    print(f"[+] Live monitoring {logfile}...")
    with open(logfile, 'r', errors='ignore') as f:
        f.seek(0, 2)
        while True:
            line = f.readline()
            if not line:
                time.sleep(1)
                continue
            matches = scan_line(line, "LIVE", rules)
            for m in matches:
                print(f"[!] {m['rule']} (LIVE): {m['log']}")
                if output:
                    with open(output, "a") as logf:
                        logf.write(json.dumps(m) + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="logsniff – Regex-based Attack Detector for Logs")
    parser.add_argument("logfile", help="Path to log file (e.g. /var/log/auth.log)")
    parser.add_argument("-r", "--rules", help="Custom rules file (name::pattern)")
    parser.add_argument("-o", "--output", help="Write JSON alerts to file")
    parser.add_argument("-t", "--tail", action="store_true", help="Live monitor mode")

    args = parser.parse_args()
    rules = BUILTIN_PATTERNS
    if args.rules:
        rules.update(load_custom_rules(args.rules))

    if args.tail:
        tail_log(args.logfile, rules, args.output)
    else:
        scan_file(args.logfile, rules, args.output)
