export class PatternMatcher {
  static matchDomain(url: string, pattern: string): boolean {
    try {
      const domain = new URL(url).hostname;
      return domain === pattern || domain.endsWith('.' + pattern);
    } catch {
      return false;
    }
  }

  static matchRegex(url: string, pattern: string): boolean {
    try {
      const regex = new RegExp(pattern);
      return regex.test(url);
    } catch {
      return false;
    }
  }

  static validateRegex(pattern: string): boolean {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  }

  static matchesPattern(url: string, pattern: string, type: 'domain' | 'regex'): boolean {
    if (type === 'domain') {
      return this.matchDomain(url, pattern);
    } else {
      return this.matchRegex(url, pattern);
    }
  }

  static extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  static isExcluded(url: string, exclusions: string[]): boolean {
    const domain = this.extractDomain(url);
    return exclusions.some(exclusion => 
      domain === exclusion || domain.endsWith('.' + exclusion)
    );
  }

  static isValidUrl(url: string): boolean {
    if (
      (!url.startsWith('http:') &&
        !url.startsWith('https:') &&
        !url.startsWith('file:')) ||
      url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url === 'about:blank' ||
      url === ''
    ) {
      return false;
    }
    return true;
  }
}