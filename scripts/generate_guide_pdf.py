from pathlib import Path
from xml.sax.saxutils import escape
import re
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Preformatted, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/pdf/guia-integracao-deploy-dnautos.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)
fonts = Path("C:/Windows/Fonts")
if fonts.exists():
    for name, filename in [("Body","arial.ttf"),("BodyBold","arialbd.ttf"),("Mono","consola.ttf")]:
        pdfmetrics.registerFont(TTFont(name, str(fonts / filename)))
else:
    fonts = Path("/usr/share/fonts/truetype/dejavu")
    for name, filename in [("Body","DejaVuSans.ttf"),("BodyBold","DejaVuSans-Bold.ttf"),("Mono","DejaVuSansMono.ttf")]:
        pdfmetrics.registerFont(TTFont(name, str(fonts / filename)))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="BodyBold")
navy = colors.HexColor("#122031")
orange = colors.HexColor("#e65b00")
styles = {
    "body": ParagraphStyle("BodyText", fontName="Body",fontSize=9.2,leading=13.3,textColor=navy,spaceAfter=8,splitLongWords=True),
    "title": ParagraphStyle("Cover", fontName="BodyBold",fontSize=33,leading=38,textColor=navy,spaceAfter=22),
    "chapter": ParagraphStyle("Chapter",fontName="BodyBold",fontSize=19,leading=24,textColor=navy,spaceAfter=18,keepWithNext=True),
    "small": ParagraphStyle("Small",fontName="Body",fontSize=8,leading=11,textColor=colors.HexColor("#526174"),spaceAfter=7,splitLongWords=True),
    "code": ParagraphStyle("Code",fontName="Mono",fontSize=7.2,leading=10.2,textColor=navy,backColor=colors.HexColor("#f1f4f6"),borderPadding=9,spaceBefore=5,spaceAfter=13),
}
doc = SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=57,bottomMargin=48,title="DNAutos - Guia de integração e deploy",author="DNAutos Vistorias")
source=(ROOT/"docs/GUIA_INTEGRACAO_DEPLOY.md").read_text(encoding="utf-8")
story=[]
def para(text, small=False):
    safe=escape(text)
    if text.startswith("http") or text.startswith("Fonte") or text.startswith("Tutorial"):
        safe=re.sub(r"(https://[^\s]+)",r'<link href="\1" color="#c94f00">\1</link>',safe)
        small=True
    story.append(Paragraph(safe,styles["small" if small else "body"]))
lines=source.splitlines()
i=0
while i<len(lines):
    line=lines[i]
    if line.startswith("# "):
        story += [Spacer(1,95),Paragraph("GUIA DE IMPLANTAÇÃO",ParagraphStyle("Eyebrow",fontName="BodyBold",fontSize=11,leading=16,textColor=orange,spaceAfter=15)),Paragraph(escape(line[2:]),styles["title"])]
        i+=1
    elif line.startswith("## "):
        story += [PageBreak(),Paragraph(escape(line[3:]),styles["chapter"])]
        i+=1
    elif line.startswith("```"):
        i+=1;code=[]
        while i<len(lines) and not lines[i].startswith("```"):
            code.append(lines[i]);i+=1
        story.append(Preformatted("\n".join(code),styles["code"],maxLineLength=106,splitChars=" /"))
        i+=1
    elif line.strip():
        group=[line];i+=1
        # Join ordinary paragraph lines, preserve checklist/numbered steps.
        if not re.match(r"^(- |\d+\. )",line):
            while i<len(lines) and lines[i].strip() and not lines[i].startswith(("#","```","- ")) and not re.match(r"^\d+\. ",lines[i]):
                group.append(lines[i]);i+=1
        para(" ".join(group))
    else:
        i+=1
def furniture(canvas, document):
    w,h=A4
    canvas.setStrokeColor(orange);canvas.setLineWidth(2);canvas.line(48,h-35,w-48,h-35)
    canvas.setFont("BodyBold",8);canvas.setFillColor(navy);canvas.drawString(48,h-27,"DNAUTOS  /  INTEGRAÇÃO E HOSPEDAGEM")
    canvas.setFont("Body",7.5);canvas.setFillColor(colors.HexColor("#667485"))
    canvas.drawString(48,29,"11/11/2026  |  Serviços externos sujeitos a homologação")
    canvas.drawRightString(w-48,29,str(document.page))
doc.build(story,onFirstPage=furniture,onLaterPages=furniture)
print(str(OUT))
