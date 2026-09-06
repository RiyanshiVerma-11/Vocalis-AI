import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, color_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=140, bottom=140, left=200, right=200):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_left_border(cell, color_hex="4338CA", size=36):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    
    left = OxmlElement('w:left')
    left.set(qn('w:val'), 'single')
    left.set(qn('w:sz'), str(size))
    left.set(qn('w:space'), '0')
    left.set(qn('w:color'), color_hex)
    tcBorders.append(left)
    
    for b in ['top', 'bottom', 'right']:
        node = OxmlElement(f'w:{b}')
        node.set(qn('w:val'), 'none')
        tcBorders.append(node)
        
    tcPr.append(tcBorders)

def add_callout_box(doc, title, text, box_type="speech"):
    # box_type: "speech" (indigo), "action" (teal), "tip" (amber), "alert" (rose)
    palette = {
        "speech": {"bg": "F8FAFC", "border": "4338CA", "title_color": RGBColor(67, 56, 202), "icon": "🗣️ SPOKEN SCRIPT (VERBATIM)"},
        "action": {"bg": "F0FDF4", "border": "059669", "title_color": RGBColor(5, 150, 105), "icon": "🖥️ SCREEN ACTION & CLICKS"},
        "tip": {"bg": "FFFBEB", "border": "D97706", "title_color": RGBColor(217, 119, 6), "icon": "💡 PRESENTER NOTE & CUE"},
        "alert": {"bg": "FFF1F2", "border": "E11D48", "title_color": RGBColor(225, 29, 72), "icon": "⚠️ KEY DEMO VERIFICATION POINT"}
    }
    
    cfg = palette.get(box_type, palette["speech"])
    
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, cfg["bg"])
    set_cell_left_border(cell, cfg["border"], size=36)
    set_cell_margins(cell, top=140, bottom=140, left=220, right=200)
    
    # Title paragraph
    p_title = cell.paragraphs[0]
    p_title.paragraph_format.space_before = Pt(2)
    p_title.paragraph_format.space_after = Pt(4)
    run_icon = p_title.add_run(f"{cfg['icon']}: {title}\n")
    run_icon.bold = True
    run_icon.font.name = "Calibri"
    run_icon.font.size = Pt(10.5)
    run_icon.font.color.rgb = cfg["title_color"]
    
    # Text paragraph
    p_text = cell.add_paragraph()
    p_text.paragraph_format.space_before = Pt(0)
    p_text.paragraph_format.space_after = Pt(2)
    p_text.paragraph_format.line_spacing = 1.15
    run_text = p_text.add_run(text)
    run_text.font.name = "Calibri"
    run_text.font.size = Pt(10.5)
    run_text.font.color.rgb = RGBColor(30, 41, 59)
    if box_type == "speech":
        run_text.italic = True

    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_before = Pt(2)
    p_spacer.paragraph_format.space_after = Pt(4)

def format_table(table, col_widths, headers, data):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    # Header Row
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = Inches(col_widths[i])
        set_cell_background(hdr_cells[i], "0F172A")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(title)
        run.bold = True
        run.font.name = "Calibri"
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(255, 255, 255)
        
    # Data Rows
    for row_idx, row_data in enumerate(data):
        row = table.add_row()
        bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, cell_value in enumerate(row_data):
            cell = row.cells[col_idx]
            cell.width = Inches(col_widths[col_idx])
            set_cell_background(cell, bg_color)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run = p.add_run(cell_value)
            run.font.name = "Calibri"
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(30, 41, 59)

def build_complete_script():
    doc = Document()
    
    # Page setup - Standard 1 inch margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)
        section.different_first_page_header_footer = False
        
        # Header & Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("Vocalis AI — Complete Video Presentation & Demo Script | EchoSphere PS11")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(148, 163, 184)
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Confidential — Built for EchoSphere Hackathon 2026 | Powered by Agora Real-Time Voice SD-RTN™")
        frun.font.name = "Calibri"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(148, 163, 184)

    # ── DOCUMENT HEADER ──
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("🎙️ Vocalis AI — Official Video Demo & Pitch Script")
    r_title.bold = True
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(22)
    r_title.font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(12)
    r_sub = p_sub.add_run("Comprehensive Production Script Covering Both Candidate Studio & Recruiter Talent Hub | PS11")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = RGBColor(67, 56, 202)
    r_sub.bold = True

    # Quick Meta Table
    meta_table = doc.add_table(rows=1, cols=4)
    format_table(
        meta_table,
        [1.6, 1.6, 1.6, 1.7],
        ["Target Duration", "Author / Team", "Core Voice Engine", "Submission Track"],
        [["5 – 7 Minutes (or 4-Min Cut)", "Riyanshi Verma", "Agora agents v2.7.0 (SD-RTN)", "EchoSphere PS11 (AI Interview)"]]
    )
    
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(8)
    p_div.paragraph_format.space_after = Pt(8)

    # ── SECTION 1: SIMPLIFIED NARRATIVE (PROBLEM & SOLUTION) ──
    h1 = doc.add_heading("1. Executive Summary & Simplified Pitch Narrative", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    
    p_intro = doc.add_paragraph(
        "This section takes the complex enterprise problem statement and transforms it into natural, high-impact conversational language that hooks judges and executives within the first 45 seconds."
    )
    p_intro.paragraph_format.space_after = Pt(8)

    add_callout_box(
        doc,
        "The Senior Hiring Bottleneck (In Easy, Everyday Language)",
        '"Let’s be honest: hiring senior engineers right now is completely broken.\n\n'
        'Your most expensive leaders—Staff and Principal architects—are losing 15 to 20 percent of their valuable time every single week running the exact same repetitive first-round technical screenings. For every 100 engineers a growing company hires, they’re literally burning over $1.2 million dollars in lost developer velocity and delayed product launches.\n\n'
        'And what about current AI interview chatbots? They are completely inadequate for senior talent. They feel like a lonely chatbot reading off a static quiz. They suffer from awkward 2-second delays, you can’t interrupt them to explain a nuance, they judge you from a single flat perspective, and at the end of the call, they give you vague, unproven scores with zero evidence."',
        "speech"
    )

    add_callout_box(
        doc,
        "The Vocalis AI Solution (In Easy, Everyday Language)",
        '"That is why we built Vocalis AI.\n\n'
        'Instead of a lonely chatbot, candidates walk into a live, interactive interview room with a full cross-functional AI committee—powered by Agora’s sub-100 millisecond Real-Time Network.\n\n'
        'You face specialized interviewers: a Systems Architect probing concurrency and fault tolerance, a Product Manager demanding conversion ROI, and an Engineering VP challenging your deadlines and tech debt. Behind the scenes, these AI interviewers deliberate backstage, pass the floor seamlessly, and remember everything from your resume and live architecture sketches.\n\n'
        'Candidates get crisp, studio-quality 48kHz audio with natural barge-in—if you start speaking, the AI stops instantly, just like real people in an executive boardroom. And for hiring managers? Vocalis delivers 100% evidence-backed scorecards that cite the candidate’s exact words. The result: 80% reduction in engineering screening hours, over $1.2M saved per 100 hires, and mathematically audited demographic fairness."',
        "speech"
    )

    # ── SECTION 2: RECORDING SETUP & PRE-FLIGHT CHECKLIST ──
    h2 = doc.add_heading("2. Video Production & Pre-Flight Setup Checklist", level=1)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)

    checklist_table = doc.add_table(rows=1, cols=3)
    format_table(
        checklist_table,
        [1.8, 2.5, 2.2],
        ["Step / Item", "Configuration & Recommended State", "Key Verification Point"],
        [
            ["Browser Window", "Google Chrome, 1920x1080 full screen, 100% zoom", "https://vocalis-ai-phi.vercel.app"],
            ["Microphone & Audio", "High-quality USB headset or cardioid mic", "No background echo; Agora VAD clean pickup"],
            ["Webcam Framing", "Chest-up framing, bottom-right camera overlay", "Good frontal lighting, steady eye contact"],
            ["Tab Setup", "Tab 1: Vocalis Live App | Tab 2: GitHub README", "Ready for fast tab-switch to show SDK table"],
            ["Candidate Test Login", "candidate@vocalis.ai / demo123 (or 1-click button)", "Opens Candidate Practice Studio"],
            ["Recruiter Test Login", "recruiter@vocalis.ai / demo123 (or 1-click button)", "Opens Enterprise Recruiter Talent Hub"]
        ]
    )

    p_div2 = doc.add_paragraph()
    p_div2.paragraph_format.space_before = Pt(8)
    p_div2.paragraph_format.space_after = Pt(8)

    # ── SECTION 3: ACT-BY-ACT STEP-BY-STEP SCRIPT ──
    h3 = doc.add_heading("3. Step-by-Step Video Walkthrough Script", level=1)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)

    # ACT 1
    doc.add_heading("🎬 ACT 1 — The Hook & The Broken Hiring Problem (0:00 – 0:45)", level=2)
    
    add_callout_box(
        doc,
        "Camera & Visual Setup",
        "Presenter faces the camera directly with a crisp, professional posture. Screen shows either a darkened title card or a subtle blurred view of the Vocalis 5-panel stage.",
        "action"
    )

    add_callout_box(
        doc,
        "Act 1 Spoken Dialogue",
        '"Every year, companies spend billions trying to hire senior engineers. But here is the dirty secret of tech hiring: Staff and Principal engineers are spending up to 20% of their entire bandwidth running repetitive first-round screens. For every 100 hires, that is over $1.2 million dollars lost in delayed product velocity.\n\n'
        'And today’s AI interview chatbots? They’re a joke for senior technical roles. They have 2-second awkward pauses, they can’t handle interruptions, they view candidates through a single flat lens, and their feedback is completely generic.\n\n'
        'What if, instead of an awkward chatbot, your candidate stepped into a live voice room with a full, autonomous hiring panel? A panel that deliberates backstage, adapts questions on the fly, listens with sub-100 millisecond response times, and produces 100% quote-backed hiring decisions?\n\n'
        'Welcome to Vocalis AI. Built on Agora Conversational AI."',
        "speech"
    )

    # ACT 2
    doc.add_heading("🎬 ACT 2 — Agora Conversational AI Architecture Proof (0:45 – 1:20)", level=2)

    add_callout_box(
        doc,
        "Show README / Architecture Blueprint",
        "Switch screen to project README or Architecture Slide. Point specifically to the agora-agents v2.7.0 package confirmation, Deepgram Nova-3 STT, Groq sub-100ms reasoning, and MiniMax TTS pipeline.",
        "action"
    )

    add_callout_box(
        doc,
        "Act 2 Spoken Dialogue",
        '"For the EchoSphere PS11 Challenge, we had one non-negotiable rule: use the official Agora Conversational AI SDK. We didn’t build a toy wrapper. Every single voice you will hear today is powered by the official agora-agents v2.7.0 TypeScript SDK, deployed directly onto Agora’s SD-RTN media cloud.\n\n'
        'Deepgram Nova-3 streams real-time speech recognition into Agora. Groq Qwen-3.8-27B and Google Gemini 2.5 Flash deliver sub-100 millisecond deliberation, and MiniMax Speech-2.6-Turbo gives each interviewer a distinct, lifelike voice.\n\n'
        'Let’s dive into the live app and experience both sides of the platform: the Candidate Practice Studio, and the enterprise Recruiter Talent Hub."',
        "speech"
    )

    # ACT 3
    doc.add_heading("🎬 ACT 3 — Candidate Practice Studio Walkthrough (1:20 – 3:30)", level=2)

    add_callout_box(
        doc,
        "Login & AI Disclosure Banner Verification",
        "Navigate to https://vocalis-ai-phi.vercel.app/. Click 'Candidate Login' preset (candidate@vocalis.ai). Highlight the persistent golden AI Disclosure Banner at the top of the interface.",
        "action"
    )

    add_callout_box(
        doc,
        "Act 3.1 Spoken Dialogue: Transparent Entry & Resume Memory",
        '"I’m logging in as a candidate. Notice immediately at the top of the screen: our persistent AI Disclosure Banner. In compliance with PS11 requirement number 11, candidates are explicitly notified they are interacting with an autonomous AI panel. It is always visible and cannot be dismissed.\n\n'
        'On the left, our resume parser has already ingested the candidate’s PDF background—highlighting their past experience at Stripe, caching architectures, and concurrency expertise. All 5 of our AI committee members share this exact memory bus."',
        "speech"
    )

    add_callout_box(
        doc,
        "Role-Play Scenario Selection",
        "Click the Scenario Selector dropdown. Choose 'The Missing Business Impact' (PS11 Role-Play Challenge Scenario).",
        "action"
    )

    add_callout_box(
        doc,
        "Act 3.2 Spoken Dialogue: Scenario Setup",
        '"Let’s select the official PS11 demonstration scenario: ‘The Missing Business Impact’. In this scenario, the candidate explains a technical architectural decision, but fails to mention business conversion. Watch how Rohan—our Systems Architect—accepts the engineering plumbing, but Priya—our Principal PM—steps in to challenge the ROI."',
        "speech"
    )

    add_callout_box(
        doc,
        "Start Voice Session & Demonstrate Sub-100ms Barge-In",
        "Click 'Start Interview'. Agora RTC engine connects. Waveform visualizer pulses. Rohan Sharma speaks. While Rohan is speaking, speak firmly into your microphone: 'Actually Rohan, let me stop you right there and jump directly to our Redis caching layer.' Observe Rohan mute instantly.",
        "action"
    )

    add_callout_box(
        doc,
        "Act 3.3 Spoken Dialogue: Real-Time Audio & Instant Barge-In",
        '"Here is Rohan opening the interview... Now watch this: (Interrupt into microphone: "Actually Rohan, let me jump straight to our Redis caching layer."). Notice how Rohan ceased playback in under 100 milliseconds! That is true Agora VAD barge-in. No waiting for sentences to finish, no robotic clashes—natural, conversational flow.\n\n'
        'Now let me give my answer: (Speak into mic: "We implemented a write-through Redis cache with Pub/Sub invalidation across 12 distributed nodes. It brought our 99th percentile query latency from 400 milliseconds down to 35 milliseconds.")"',
        "speech"
    )

    add_callout_box(
        doc,
        "Backstage Deliberation & Role Handoff",
        "Expand the Backstage Thoughts feed in TranscriptView. Point to the JSON deliberation log showing answerDepth='Senior (Advanced)' and turnTakingReason. Priya Mehta takes the floor.",
        "action"
    )

    add_callout_box(
        doc,
        "Act 3.4 Spoken Dialogue: Controlled Committee Turn-Taking",
        '"Look at the Backstage Thoughts feed! The panel analyzed my response in real time: classified as Senior-level distributed systems depth. Rohan is satisfied, so Priya Mehta—our Product Manager—takes the floor. Listen to Priya: she’s asking: "That architecture is impressive for uptime, but how did that cache change impact checkout conversion and revenue during flash sales?" Exactly the PS11 scenario!"',
        "speech"
    )

    add_callout_box(
        doc,
        "System Design Whiteboard Synchronization",
        "Click 'System Design Whiteboard'. Draw or select a system diagram (Client -> API Gateway -> Redis Cache -> PostgreSQL). Click 'Sync Diagram with Panel'.",
        "action"
    )

    add_callout_box(
        doc,
        "Act 3.5 Spoken Dialogue: Live Architecture Whiteboard",
        '"Senior technical interviews require whiteboarding. Vocalis includes a live architecture canvas. I can connect microservices, databases, and message queues, and click "Sync Diagram with Panel". This immediately injects the diagram nodes and protocols into the AI committee’s context. Vikram and Rohan will now reference these exact components in their next question."',
        "speech"
    )

    add_callout_box(
        doc,
        "Difficulty Sparkline & Vague Answer Detection",
        "Show the Difficulty Trajectory sparkline climbing to Senior. Then speak into mic a vague response: 'We just used industry best practices and scaled everything smoothly.' Point out the ⚠️ VAGUE ANSWER ALERT card appearing live.",
        "action"
    )

    add_callout_box(
        doc,
        "Act 3.6 Spoken Dialogue: Dynamic Calibration & Real-Time Flags",
        '"See our SVG Difficulty Trajectory sparkline: it dynamically adjusted from Foundational up to Senior based on my technical precision.\n\n'
        'Now watch what happens when I give a fluffy, buzzword answer: (Speak into mic: "We just used industry best practices and scaled everything smoothly."). Immediately, a live alert card triggers: "⚠️ Vague Answer Detected — Missing quantitative throughput metrics." If I contradicted my resume, a "Contradiction Detected" flag fires instantly."',
        "speech"
    )

    add_callout_box(
        doc,
        "End Session & Generate 360° Scorecard",
        "Click 'End Interview' -> Click 'Generate Final Assessment'. The FinalAssessmentModal slides open.",
        "action"
    )

    add_callout_box(
        doc,
        "Act 3.7 Spoken Dialogue: Verbatim Quote-Citing Scorecard",
        '"Let’s finish the session and generate the executive scorecard. This is what sets Vocalis apart from any tool in the world. Instead of vague gut feelings, look at the Quote Citations section:\n\n'
        'Every single competency rating is tied to verbatim quotes with exact turn numbers from the transcript! Turn 2: "We implemented write-through Redis cache with Pub/Sub invalidation" — verified as Senior distributed systems mastery. Turn 5: "We scaled everything smoothly" — cited as evidence of shallow business impact. Objective, auditable, and indisputable."',
        "speech"
    )

    # ACT 4
    doc.add_heading("🎬 ACT 4 — Recruiter & Hiring Team Hub Deep Dive (3:30 – 5:15)", level=2)

    add_callout_box(
        doc,
        "Switch to Recruiter Dashboard",
        "Log out or click workspace switcher -> Sign in with 1-click preset recruiter@vocalis.ai. The 3-tab Recruiter Dashboard opens.",
        "action"
    )

    add_callout_box(
        doc,
        "Act 4.1 Spoken Dialogue: Enterprise Talent Overview",
        '"Now let’s flip to the other side of the platform: the Recruiter and Hiring Team Hub. Logging in as recruiter@vocalis.ai loads our enterprise dashboard, pre-populated with our company profile: Acme Cloud, hiring for Senior Distributed Systems Engineers.\n\n'
        'The dashboard is split into three powerful tabs: Analytics, Candidate Pipeline, and Requisitions."',
        "speech"
    )

    add_callout_box(
        doc,
        "Tab 1: Analytics, Demographics & Visualizers",
        "Stay on Tab 1 (Analytics). Point out RecruiterHeaderStats (KPIs, Pass Rate, Avg Score, Female/Male ratio), TopPerformersShowcase, StateProportionVisualizer, and ExperienceRatioVisualizer.",
        "action"
    )

    add_callout_box(
        doc,
        "Act 4.2 Spoken Dialogue: Cohort Demographics & Fair Analytics",
        '"In Tab 1, hiring managers get an instant executive pulse: total evaluated candidates, overall pass rate, average scores, and our live female-to-male ratio.\n\n'
        'Below that, the Top Performers Showcase highlights our highest-scoring female and male candidates side-by-side. The State Proportion Visualizer maps candidate origins across India—from Telangana and Karnataka to Maharashtra—allowing one-click regional filtering. And our Experience Ratio Visualizer breaks down candidate performance across 5 distinct tiers, from Freshers to 10+ year Staff engineers."',
        "speech"
    )

    add_callout_box(
        doc,
        "Tab 2: Pipeline Table & 360° Scorecard Drawer",
        "Click Tab 2 (Candidates). Show the rich filter bar, sortable pipeline table, and 1-click 'Export CSV' button. Click on a candidate row (e.g., Jordan Reed or Priya Sharma) to open the CandidateScorecardDrawer.",
        "action"
    )

    add_callout_box(
        doc,
        "Act 4.3 Spoken Dialogue: Pipeline Management & Deep Evaluation Drawer",
        '"Tab 2 is the operational pipeline. Recruiters can filter by gender, state, experience tier, or recommendation verdict, and export clean CSV reports for their ATS in one click. Even better: any live session we just conducted is automatically saved into this pipeline via sessionHistoryService!\n\n'
        'Clicking any candidate opens the full 360° Candidate Scorecard Drawer with three detailed views:\n'
        '• Q&A Review: Every panelist’s score, verdict, and verbatim transcript quotes.\n'
        '• Overview: The full radar competency profile, jargon audit checking buzzword density versus practical depth, and custom onboarding plan.\n'
        '• Bar Raiser Challenge: The full challenge log showing what the AI probed, how the candidate adjusted, and the final hiring bar verdict."',
        "speech"
    )

    add_callout_box(
        doc,
        "Tab 3: Committee Rubrics & Requisition Studio",
        "Click Tab 3 (Requisitions). Show the enterprise rubric cards (Google L5/L6, Amazon Bar Raiser, FAANG Principal). Click 'Import Rubric' to show the RubricImporterModal with JD text / PDF parsing.",
        "action"
    )

    add_callout_box(
        doc,
        "Act 4.4 Spoken Dialogue: Enterprise Rubrics & Custom Screening Links",
        '"Tab 3 manages job requisitions and interview rubrics. Recruiters can choose from pre-calibrated enterprise rubrics—like Google L5 System Design, Amazon Bar Raiser, or Startup IC5—or click "Import Rubric" to upload a job description PDF. Our AI parses the required competencies and auto-tunes the interview committee.\n\n'
        'Recruiters can also copy an instant, shareable candidate interview link to send directly to applicants."',
        "speech"
    )

    add_callout_box(
        doc,
        "Fairness Tools: Demographic Transparency & Parity Shortlist",
        "Click 'Demographic Audit' button in header to open DemographicTransparencyModal. Then click 'Parity Shortlist' button to open ParityShortlistModal.",
        "action"
    )

    add_callout_box(
        doc,
        "Act 4.5 Spoken Dialogue: Cutting-Edge Fairness & Parity Shortlist Builder",
        '"Finally, the crown jewel of our recruiter hub: our Advanced Fairness & Compliance Tools.\n\n'
        'Clicking "Demographic Audit" opens a complete transparency report comparing our candidate pool against our company diversity goals. We track gender ratios, score distributions, and representation without ever lowering the technical bar.\n\n'
        'And with the Parity Shortlist Builder, recruiters can set a target ratio—for example, 50% women and 50% men from the top 10 candidates—and the algorithm instantly surfaces the highest-scoring candidates from each cohort. Every card is clickable, taking the hiring committee straight to their quote-backed scorecard. Zero bias, total merit, mathematically proven fairness."',
        "speech"
    )

    # ACT 5
    doc.add_heading("🎬 ACT 5 — PS11 Compliance Matrix & Business ROI Finale (5:15 – 6:00)", level=2)

    add_callout_box(
        doc,
        "Final Screen & Closing Shot",
        "Presenter returns to camera full-screen or displays the Vocalis AI summary slide showing the PS11 compliance checklist and ROI metrics.",
        "action"
    )

    add_callout_box(
        doc,
        "Act 5 Spoken Dialogue: The Winning Pitch Conclusion",
        '"To wrap up, let’s revisit the EchoSphere PS11 challenge requirements:\n\n'
        '1. Agora Conversational AI SDK? Deployed with agora-agents v2.7.0 on SD-RTN.\n'
        '2. Sub-100ms interruptible voice? Live VAD barge-in demonstrated.\n'
        '3. Multiple interviewer roles? 5 distinct cross-functional personas.\n'
        '4. Shared context memory? Unified bus connecting resume, whiteboard, and turns.\n'
        '5. Dynamic calibration? Live SVG trajectory from Foundational to Staff.\n'
        '6. Contradiction and vague detection? Real-time alert cards on screen.\n'
        '7. Evidence-based scorecards? 100% quote-backed citations.\n'
        '8. Clear AI disclosure? Persistent banner always visible.\n'
        '9. Enterprise recruiter hub? Full 3-tab hiring dashboard with demographic parity tools.\n\n'
        'Vocalis AI saves companies over $1.2 million dollars per 100 hires, reduces engineering interview fatigue by 80%, and gives every candidate a fair, objective, and unforgettable interview experience.\n\n'
        'Thank you! We invite the judges to test our live demo at vocalis-ai-phi.vercel.app."',
        "speech"
    )

    # ── SECTION 4: PS11 COMPLIANCE VERIFICATION TABLE ──
    h4 = doc.add_heading("4. Official EchoSphere PS11 Requirements Cross-Reference", level=1)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)

    comp_table = doc.add_table(rows=1, cols=4)
    format_table(
        comp_table,
        [0.6, 2.2, 2.0, 1.7],
        ["#", "PS11 Requirement", "Vocalis AI Implementation", "Video Timestamp & Evidence"],
        [
            ["1", "Agora Conversational AI SDK", "Official agora-agents v2.7.0 + agora-rtc-sdk-ng on SD-RTN", "0:45 – 1:10 (SDK confirmation & live test)"],
            ["2", "Real-Time & Interruptible Voice", "Sub-100ms VAD barge-in; active audio muted instantaneously", "1:55 – 2:20 (Barge-in speech demonstration)"],
            ["3", "Multiple Interviewer Roles", "5 distinct personas: Architect, PM, VP Eng, Enterprise, EQ", "1:25 – 1:40 (Avatar panel & voices)"],
            ["4", "Shared Candidate Context", "Unified memory tracking resume, whiteboard sketch, past turns", "2:25 – 2:50 (Backstage thought feed)"],
            ["5", "Dynamic Follow-Up Questions", "Multi-turn Gemini 2.5 Flash deliberation based on answer depth", "2:20 – 2:45 (PM challenging tech decision)"],
            ["6", "Controlled Turn-Taking", "JSON backstage negotiation for next speaker and rationale", "2:25 – 2:40 (Turn-taking reason in feed)"],
            ["7", "Role-Play Scenarios", "Built-in 'Missing Business Impact' PS11 role-play scenario", "1:40 – 2:00 (Scenario selector dropdown)"],
            ["8", "Difficulty Adjustment", "Live SVG trajectory sparkline (Foundational -> Staff)", "2:50 – 3:05 (Sparkline escalation)"],
            ["9", "Vague & Contradiction Detection", "Live alert cards flagging vague buzzwords and contradictions", "3:05 – 3:20 (⚠️ Vague answer alert card)"],
            ["10", "Evidence-Based Feedback", "Verbatim quotes cited with turn numbers and timestamps", "3:25 – 3:45 (Quote citations in scorecard)"],
            ["11", "Clear AI Disclosure", "Persistent AIDisclosureBanner permanently rendered at top", "1:25 – 1:35 (Golden banner highlighted)"],
            ["12", "Hiring Team Workspace", "3-tab Recruiter Hub + Demographic Parity Shortlist", "3:45 – 5:15 (Complete recruiter demo)"]
        ]
    )

    # ── SECTION 5: BUSINESS ROI SUMMARY ──
    h5 = doc.add_heading("5. Enterprise Financial ROI & Value Creation Model", level=1)
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(6)

    roi_table = doc.add_table(rows=1, cols=3)
    format_table(
        roi_table,
        [2.0, 2.3, 2.2],
        ["Metric Category", "Traditional Senior Hiring Process", "With Vocalis AI Enterprise"],
        [
            ["Staff Engineer Time / Screen", "3 to 4 hours per candidate (prep + screen + debrief)", "0.5 hours (reviewing quote-backed scorecard)"],
            ["Engineering Hours per 100 Hires", "1,600+ high-value engineering hours consumed", "Under 320 hours (80% reduction)"],
            ["Direct Cost per 100 Hires", "~$1,500,000 in diverted engineering salaries", "~$280,000 total operating investment"],
            ["Net Annual Cost Savings", "Baseline benchmark", "$1,220,000+ saved annually per 100 hires"],
            ["Time-to-Hire Cycle", "28 to 45 business days", "7 to 10 calendar days (75% faster)"],
            ["Evaluation Objectivity", "Unstructured notes prone to bias and fatigue", "100% auditable verbatim quote citations"],
            ["Demographic Equity", "Unmonitored unconscious bias in live calls", "Mathematically audited parity shortlists"]
        ]
    )

    output_path = os.path.join(os.getcwd(), "Vocalis_AI_Complete_Video_Demo_Script.docx")
    doc.save(output_path)
    print(f"Successfully generated complete script DOCX at: {output_path}")

if __name__ == "__main__":
    build_complete_script()
