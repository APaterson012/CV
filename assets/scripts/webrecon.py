#!/usr/bin/env python3

import requests
import socket
import argparse
import json
import sys
from bs4 import BeautifulSoup

# Disable warnings for HTTPS issues (insecure)
requests.packages.urllib3.disable_warnings()

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:100.0) Gecko/20100101 Firefox/100.0"
}

def load_list(path):
    try:
        with open(path, 'r') as f:
            return [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"[!] Wordlist not found: {path}")
        return []

def get_title(html):
    try:
        soup = BeautifulSoup(html, "html.parser")
        return soup.title.string.strip() if soup.title else "No title"
    except:
        return "Error parsing title"

def scan_subdomains(domain, wordlist):
    print(f"\n🌐 Scanning subdomains on: {domain}")
    found = []
    for sub in wordlist:
        target = f"{sub}.{domain}"
        try:
            ip = socket.gethostbyname(target)
            print(f"[+] Found: {target} → {ip}")
            found.append({"subdomain": target, "ip": ip})
        except socket.gaierror:
            pass
    return found

def scan_paths(domain, wordlist):
    print(f"\n📁 Scanning paths on: http://{domain}")
    found = []
    for path in wordlist:
        url = f"http://{domain}/{path}"
        try:
            res = requests.get(url, headers=DEFAULT_HEADERS, timeout=4, verify=False)
            if res.status_code not in [404, 403]:
                title = get_title(res.text)
                print(f"[!] {url} - {res.status_code} - {title}")
                found.append({"url": url, "status": res.status_code, "title": title})
        except requests.RequestException:
            pass
    return found

def passive_dns(domain):
    print(f"\n🔍 Performing passive DNS lookup on {domain}")
    try:
        result = socket.gethostbyname_ex(domain)
        print(f"[+] {domain} → {result[2]}")
        return result[2]
    except:
        print("[-] DNS lookup failed.")
        return []

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Red Team Web Recon Tool")
    parser.add_argument("domain", help="Target domain (e.g. site.com)")
    parser.add_argument("-s", "--subs", help="Subdomain wordlist")
    parser.add_argument("-d", "--dirs", help="Directory/path wordlist")
    parser.add_argument("-p", "--passive", action="store_true", help="Passive DNS mode only")
    parser.add_argument("-o", "--output", help="Save results to JSON file")

    args = parser.parse_args()

    results = {"domain": args.domain, "subdomains": [], "paths": [], "passive_dns": []}

    if args.passive:
        results["passive_dns"] = passive_dns(args.domain)
    else:
        if args.subs:
            subdomains = load_list(args.subs)
            results["subdomains"] = scan_subdomains(args.domain, subdomains)

        if args.dirs:
            paths = load_list(args.dirs)
            results["paths"] = scan_paths(args.domain, paths)

    if args.output:
        with open(args.output, "w") as f:
            json.dump(results, f, indent=2)
        print(f"\n[+] Output saved to {args.output}")
