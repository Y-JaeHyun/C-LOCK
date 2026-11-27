#!/usr/bin/env python3
"""Extract headwords from the macOS built-in 뉴에이스 국어사전 (Dictionary.app → Korean).

Stage 90 word puzzles (초성, 글자판, 앞말로 끝내기 …) are judged offline against a word list built
for each puzzle's finite answer space. This script dumps every headword so those lists can be cut.

The dictionary is copyrighted (DIOTEK / Oxford): keep the full dump local (tools/cache/ is git-ignored)
and ship only the few hundred words a puzzle needs inside its stageN.js.

usage: python3 tools/kodict.py            # writes tools/cache/ko_titles.txt
"""
import glob, os, re, sys, zlib

def find_body():
    pats = ['/System/Library/AssetsV2/*DictionaryServices*/*.asset/AssetData/Korean.dictionary/Contents/Resources/Body.data',
            '/System/Library/AssetsV2/PreinstalledAssetsV2/InstallWithOs/*DictionaryServices*/*.asset/AssetData/Korean.dictionary/Contents/Resources/Body.data',
            os.path.expanduser('~/Library/Dictionaries/*Korean*.dictionary/Contents/Resources/Body.data')]
    hits = [p for pat in pats for p in glob.glob(pat)]
    if not hits:
        sys.exit('Korean.dictionary not found. Open Dictionary.app → Settings and enable "국어사전" (Korean) first.')
    return max(hits, key=os.path.getsize)

def titles(data):
    """Body.data is a run of zlib streams; scan for zlib headers and inflate each one."""
    rx = re.compile(r'd:title="([^"]+)"')
    i = 0
    while True:
        i = data.find(b'\x78', i)
        if i < 0: break
        if data[i + 1] not in (0x01, 0x5e, 0x9c, 0xda):   # zlib header second byte
            i += 1; continue
        chunk = data[i:i + 4_000_000]
        d = zlib.decompressobj()
        try:
            out = d.decompress(chunk)
        except zlib.error:
            i += 1; continue
        if not d.eof:
            i += 1; continue
        for t in rx.findall(out.decode('utf-8', 'ignore')):
            yield t
        i += len(chunk) - len(d.unused_data)

def main():
    body = find_body()
    data = open(body, 'rb').read()
    seen, out = set(), []
    for t in titles(data):
        if t not in seen:
            seen.add(t); out.append(t)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'cache'), exist_ok=True)
    dst = os.path.join(os.path.dirname(__file__), 'cache', 'ko_titles.txt')
    open(dst, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print(f'{len(out):,} headwords → {dst}  (from {body})')

if __name__ == '__main__':
    main()
