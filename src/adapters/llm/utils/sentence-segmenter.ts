export class SentenceSegmenter {
  private static readonly SENTENCE_BOUNDARY = /[.!?。！？\\n]/u;

  private static readonly SOFT_BOUNDARY = /[,;·…]/u;

  private static readonly MAX_LEN = 120;

  private static readonly LEN_TOLERANCE = 30;

  private buf = '';

  addToken(token: string): string[] {
    const out: string[] = [];
    const trimmed = token.trim();
    const lastChar = this.buf.trimEnd().slice(-1);
    const boundary = lastChar && SentenceSegmenter.SENTENCE_BOUNDARY.test(lastChar);
    const numNext = /^\\d/.test(trimmed);

    if (boundary && !numNext) {
      out.push(this.buf.trimEnd());
      this.buf = '';
    }

    this.buf += token;

    const tooLong =
      this.buf.length > SentenceSegmenter.MAX_LEN + SentenceSegmenter.LEN_TOLERANCE &&
      /\\s/.test(token);
    const softEnd = tooLong && SentenceSegmenter.SOFT_BOUNDARY.test(trimmed);

    if (softEnd) {
      out.push(this.buf.trimEnd());
      this.buf = '';
    }
    return out;
  }

  flush(): string | null {
    const r = this.buf.trim();
    this.buf = '';
    return r || null;
  }
}
