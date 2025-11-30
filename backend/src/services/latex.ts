import type { Project, Outline, ChapterContent } from '../types';

export class LatexGenerator {
  generateDocument(
    project: Project,
    outlines: Outline[],
    contents: ChapterContent[]
  ): string {
    const header = project.latex_header || this.getDefaultHeader();
    const body = this.generateBody(outlines, contents);

    return `${header}

\\begin{document}

\\title{${this.escapeLatex(project.title)}}
\\author{AI Generated Textbook}
\\date{\\today}
\\maketitle

\\tableofcontents
\\newpage

${body}

\\end{document}`;
  }

  private generateBody(outlines: Outline[], contents: ChapterContent[]): string {
    const contentMap = new Map<string, ChapterContent>();
    contents.forEach((c) => {
      contentMap.set(c.outline_id, c);
    });

    // Build hierarchical structure
    const chapters = outlines.filter((o) => o.level === 'chapter' && !o.parent_id);

    let body = '';

    for (const chapter of chapters) {
      body += this.generateChapter(chapter, outlines, contentMap);
    }

    return body;
  }

  private generateChapter(
    chapter: Outline,
    allOutlines: Outline[],
    contentMap: Map<string, ChapterContent>
  ): string {
    let output = `\\chapter{${this.escapeLatex(chapter.title)}}\n\n`;

    const chapterContent = contentMap.get(chapter.id);
    if (chapterContent && chapterContent.content) {
      output += chapterContent.content + '\n\n';
    }

    // Get sections
    const sections = allOutlines.filter(
      (o) => o.parent_id === chapter.id && o.level === 'section'
    );

    for (const section of sections) {
      output += this.generateSection(section, allOutlines, contentMap);
    }

    return output;
  }

  private generateSection(
    section: Outline,
    allOutlines: Outline[],
    contentMap: Map<string, ChapterContent>
  ): string {
    let output = `\\section{${this.escapeLatex(section.title)}}\n\n`;

    const sectionContent = contentMap.get(section.id);
    if (sectionContent && sectionContent.content) {
      output += sectionContent.content + '\n\n';
    }

    // Get subsections
    const subsections = allOutlines.filter(
      (o) => o.parent_id === section.id && o.level === 'subsection'
    );

    for (const subsection of subsections) {
      output += this.generateSubsection(subsection, contentMap);
    }

    return output;
  }

  private generateSubsection(
    subsection: Outline,
    contentMap: Map<string, ChapterContent>
  ): string {
    let output = `\\subsection{${this.escapeLatex(subsection.title)}}\n\n`;

    const subsectionContent = contentMap.get(subsection.id);
    if (subsectionContent && subsectionContent.content) {
      output += subsectionContent.content + '\n\n';
    }

    return output;
  }

  private escapeLatex(text: string): string {
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/[&%$#_{}]/g, '\\$&')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}');
  }

  private getDefaultHeader(): string {
    return `\\documentclass[12pt]{book}
\\usepackage{amsmath, amssymb, amsthm}
\\usepackage{physics}
\\usepackage{graphicx}
\\usepackage{xcolor}
\\usepackage[UTF8]{ctex}

\\newcommand{\\ex}[1]{\\begin{exercise}#1\\end{exercise}}
\\newcommand{\\sol}[1]{\\begin{solution}#1\\end{solution}}

\\newtheorem{exercise}{例题}[section]
\\newtheorem{solution}{解析}[section]`;
  }
}
