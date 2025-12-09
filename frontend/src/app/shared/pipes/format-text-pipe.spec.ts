import { FormatTextPipe } from './format-text-pipe';
import { DomSanitizer } from '@angular/platform-browser';

describe('FormatTextPipe', () => {
  it('create an instance', () => {
    // Provide a minimal mock for DomSanitizer used by the pipe
    const mockSanitizer: Partial<DomSanitizer> = {
      bypassSecurityTrustHtml: (v: string) => v as unknown as any,
    };

    const pipe = new FormatTextPipe(mockSanitizer as DomSanitizer);
    expect(pipe).toBeTruthy();
  });
});
