#!/usr/bin/env python3
"""Cut a puzzle's accepted-word list out of the dictionary dump (run tools/kodict.py first).

  python3 tools/words.py chosung ㅍㄹㅈ                    words whose initials are exactly ㅍ ㄹ ㅈ
  python3 tools/words.py board 모나배기차카마하주구타시차바자파도리고무아호터허미 --len 3
                                                          words of LEN syllables using board tiles (each tile once)
  python3 tools/words.py ends 우산 무지개 소나기            per word: words ending with its first syllable (앞말로 끝내기)
  python3 tools/words.py has 프리즘 폭로전                  is it a headword?

Output is a JS array literal (or JSON object for `ends`) ready to paste into s90/stageN.js.
Only Hangul headwords of 2-5 syllables are considered (--min/--max to change); spaces inside headwords are removed.
"""
import argparse, json, os, re, sys
from collections import Counter

CACHE = os.path.join(os.path.dirname(__file__), 'cache', 'ko_titles.txt')
CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'

def load(lo, hi):
    if not os.path.exists(CACHE): sys.exit('run: python3 tools/kodict.py  (macOS only; builds tools/cache/ko_titles.txt)')
    rx = re.compile(r'[가-힣]{%d,%d}' % (lo, hi))
    # spaces are dropped (타나 호 → 타나호) because the game ignores spaces in answers
    return sorted({w for w in (l.strip().replace(' ', '') for l in open(CACHE, encoding='utf-8')) if rx.fullmatch(w)})

def initials(w): return ''.join(CHO[(ord(c) - 0xAC00) // 588] for c in w)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('cmd'); ap.add_argument('args', nargs='+')
    ap.add_argument('--len', type=int); ap.add_argument('--min', type=int, default=2); ap.add_argument('--max', type=int, default=5)
    a = ap.parse_args()
    words = load(a.min, a.max)
    if a.cmd == 'chosung':
        out = [w for w in words if initials(w) == a.args[0]]
    elif a.cmd == 'board':
        tiles = Counter(a.args[0]); n = a.len or 3
        out = [w for w in words if len(w) == n and not (Counter(w) - tiles)]
    elif a.cmd == 'ends':
        res = {cap: [w for w in words if w.endswith(cap[0]) and w != cap] for cap in a.args}
        for k, v in res.items(): print(f'// {k}: {len(v)} words', file=sys.stderr)
        print(json.dumps(res, ensure_ascii=False)); return
    elif a.cmd == 'has':
        s = set(words); [print(w, w in s) for w in a.args]; return
    else: sys.exit('unknown command')
    print(f'// {len(out)} words', file=sys.stderr)
    print(json.dumps(out, ensure_ascii=False))

if __name__ == '__main__':
    main()
