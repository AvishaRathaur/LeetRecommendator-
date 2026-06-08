import os
import sys
import subprocess
import re

# 1. Install fpdf2 programmatically if not installed
try:
    from fpdf import FPDF
except ImportError:
    print("fpdf2 not found. Installing dynamically...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "fpdf2"])
    from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        # Arial bold 8
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, 'LeetPath: Personalized Recommender - Interview & Presentation Guide', 0, 0, 'L')
        self.ln(10)
        self.set_draw_color(220, 220, 220)
        self.line(10, 18, 200, 18)

    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        # Arial italic 8
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128)
        # Page number
        self.cell(0, 10, 'Page ' + str(self.page_no()) + '/{nb}', 0, 0, 'C')

def clean_math_and_markdown(text):
    # Replaces complex mathematical LaTeX notations with clean text equivalent
    replacements = [
        (r'\$\$([\s\S]*?)\$\$', r'\1'), # Remove double $$ block wrapper
        (r'\$([\s\S]*?)\$', r'\1'), # Remove single $ inline wrapper
        (r'\\propto', ' is proportional to '),
        (r'\\theta', 'theta'),
        (r'\\phi', 'phi'),
        (r'\\psi', 'psi'),
        (r'\\alpha', 'alpha'),
        (r'\\beta', 'beta'),
        (r'\\chi', 'chi'),
        (r'\\mathbf\{z\}', 'z'),
        (r'\\mathbf\{w\}', 'w'),
        (r'\\mathbf\{X\}', 'X'),
        (r'\\mathbf\{x\}', 'x'),
        (r'\\prod_\{i \\in V\}', 'Product over nodes i (in Vertices V) of '),
        (r'\\prod_\{(u, v) \\in E\}', 'Product over edges (u,v) (in Edges E) of '),
        (r'\\prod_\{k \\in \\mathcal\{N\}\(u\) \\setminus \\{v\\\}\}', 'Product over neighbors of u (excluding v) of '),
        (r'\\prod_\{k \\in \\mathcal\{N\}\(u\)\}', 'Product over all neighbors of u of '),
        (r'\\sum_\{x_u\}', 'Sum over states of u of '),
        (r'\\sum_\{x\'_u\}', 'Sum over states of u of '),
        (r'\\sum_\{k\'=1\}^K', 'Sum from k=1 to K of '),
        (r'\\sum_\{v\'=1\}^V', 'Sum from v=1 to V of '),
        (r'\\sum_\{k\'\}', 'Sum over k of '),
        (r'\\mathcal\{N\}\(u\)', 'Neighbors of u'),
        (r'\\setminus', ' excluding '),
        (r'\\in', ' in '),
        (r'\\notin', ' not in '),
        (r'\\to', ' -> '),
        (r'\\psi_i\(x_i\)', 'psi_i(x_i)'),
        (r'\\psi_\{i,j\}\(x_i, x_j\)', 'psi_ij(x_i, x_j)'),
        (r'\\psi_u\(x_u\)', 'psi_u(x_u)'),
        (r'\\psi_\{u,v\}\(x_u, x_v\)', 'psi_uv(x_u, x_v)'),
        (r'm_\{u \\to v\}\(x_v\)', 'm_u->v(x_v)'),
        (r'm_\{k \\to u\}\(x_u\)', 'm_k->u(x_u)'),
        (r'b_u\(x_u\)', 'b_u(x_u)'),
        (r'n_\{d,k\}\^\{-i\}', 'n_d_k (excluding word i)'),
        (r'n_\{k,v\}\^\{-i\}', 'n_k_v (excluding word i)'),
        (r'n_k\^\{-i\}', 'n_k (excluding word i)'),
        (r'z_i = k', 'z_i = k'),
        (r'w_i = v', 'w_i = v'),
        (r'\*\*([^*]+)\*\*', r'\1'), # Bold Markdown text remover
        (r'\`([^`]+)\`', r'\1'), # Code quotes remover
    ]
    
    cleaned = text
    for pattern, repl in replacements:
        cleaned = re.sub(pattern, repl, cleaned)
    return cleaned.strip()

def build_pdf(md_path, pdf_path):
    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    
    # Title Page
    pdf.set_font('Arial', 'B', 24)
    pdf.set_text_color(26, 82, 118) # Deep Blue
    pdf.ln(30)
    pdf.cell(0, 15, 'LeetPath Recommender System', 0, 1, 'C')
    pdf.set_font('Arial', '', 14)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 10, 'Personalized Problem Recommendations & Analytical Dashboard', 0, 1, 'C')
    
    pdf.ln(10)
    pdf.set_draw_color(26, 82, 118)
    pdf.set_line_width(1)
    pdf.line(40, 75, 170, 75)
    
    pdf.ln(25)
    pdf.set_font('Arial', 'B', 12)
    pdf.set_text_color(50, 50, 50)
    pdf.cell(0, 8, 'Comprehensive Project Report & Academic Presentation Guide', 0, 1, 'C')
    pdf.set_font('Arial', 'I', 10)
    pdf.cell(0, 6, 'Prepared for Presentation & Teacher Q&A Defense', 0, 1, 'C')
    
    pdf.ln(40)
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(0, 6, 'Topics Covered:', 0, 1, 'C')
    pdf.set_font('Arial', '', 9)
    pdf.cell(0, 5, '1. System Architecture & Dashboard Features', 0, 1, 'C')
    pdf.cell(0, 5, '2. Collapsed Gibbs Sampling LDA Topic Modeling', 0, 1, 'C')
    pdf.cell(0, 5, '3. Pairwise Markov Random Fields (MRF) Graph Potentials', 0, 1, 'C')
    pdf.cell(0, 5, '4. Sum-Product Belief Propagation Inference', 0, 1, 'C')
    pdf.cell(0, 5, '5. Comprehensive Q&A for Academic Vetting', 0, 1, 'C')
    
    pdf.add_page()
    pdf.set_y(25)
    
    # Read Markdown
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    in_code_block = False
    in_mermaid = False
    
    for line in lines:
        line_strip = line.strip()
        
        # Code Block Boundaries
        if line_strip.startswith('```'):
            if in_code_block or in_mermaid:
                in_code_block = False
                in_mermaid = False
            else:
                if 'mermaid' in line_strip:
                    in_mermaid = True
                else:
                    in_code_block = True
            continue
            
        # Skip rendering raw mermaid code inside PDF
        if in_mermaid:
            continue
            
        # Render code blocks in light grey rectangle box
        if in_code_block:
            pdf.set_font('Courier', '', 9)
            pdf.set_text_color(40, 40, 40)
            pdf.set_fill_color(245, 245, 245)
            # Replace characters that might fail FPDF
            clean_line = line.replace('\n', '').replace('\r', '')
            # Clean non-latin mathematical characters
            clean_line = clean_line.encode('latin1', 'replace').decode('latin1')
            pdf.cell(0, 5, clean_line, 0, 1, 'L', fill=True)
            continue
            
        # Headers
        if line_strip.startswith('# '):
            pdf.ln(8)
            pdf.set_font('Arial', 'B', 16)
            pdf.set_text_color(26, 82, 118)
            cleaned = clean_math_and_markdown(line_strip[2:])
            pdf.cell(0, 10, cleaned, 0, 1, 'L')
            pdf.ln(2)
        elif line_strip.startswith('## '):
            pdf.ln(6)
            pdf.set_font('Arial', 'B', 13)
            pdf.set_text_color(40, 116, 166)
            cleaned = clean_math_and_markdown(line_strip[3:])
            pdf.cell(0, 8, cleaned, 0, 1, 'L')
            pdf.ln(2)
        elif line_strip.startswith('### '):
            pdf.ln(4)
            pdf.set_font('Arial', 'B', 11)
            pdf.set_text_color(50, 50, 50)
            cleaned = clean_math_and_markdown(line_strip[4:])
            pdf.cell(0, 6, cleaned, 0, 1, 'L')
            pdf.ln(1)
        # Bullet list items
        elif line_strip.startswith('* ') or line_strip.startswith('- '):
            pdf.set_font('Arial', '', 10)
            pdf.set_text_color(60, 60, 60)
            content = line_strip[2:]
            cleaned = clean_math_and_markdown(content)
            # Unicode check
            cleaned = cleaned.encode('latin1', 'replace').decode('latin1')
            pdf.cell(8, 6, chr(149), 0, 0, 'R')
            pdf.multi_cell(0, 6, cleaned)
        # Blockquote / Warning Alert
        elif line_strip.startswith('> '):
            pdf.set_font('Arial', 'I', 10)
            pdf.set_text_color(80, 80, 80)
            pdf.set_fill_color(250, 250, 240)
            content = line_strip[2:]
            cleaned = clean_math_and_markdown(content)
            cleaned = cleaned.encode('latin1', 'replace').decode('latin1')
            pdf.multi_cell(0, 6, '    ' + cleaned, 0, 'L', fill=True)
            pdf.ln(2)
        # Empty Line
        elif not line_strip:
            pdf.ln(3)
        # Normal Paragraph Line
        else:
            pdf.set_font('Arial', '', 10)
            pdf.set_text_color(60, 60, 60)
            cleaned = clean_math_and_markdown(line_strip)
            cleaned = cleaned.encode('latin1', 'replace').decode('latin1')
            pdf.multi_cell(0, 6, cleaned)
            
    # Output to disk
    pdf.output(pdf_path)
    print(f"PDF generated successfully at: {pdf_path}")

if __name__ == '__main__':
    base_dir = os.path.dirname(__file__)
    md_file = os.path.join(base_dir, "..", "..", "brain", "8aaac0dc-8bc8-464c-84c7-8fd38c806cd8", "project_presentation_guide.md")
    pdf_out = os.path.join(base_dir, "..", "LeetPath_Presentation_Guide.pdf")
    
    if not os.path.exists(md_file):
        # Fallback if appData directory structure is localized differently
        md_file = "project_presentation_guide.md"
        
    build_pdf(md_file, pdf_out)
