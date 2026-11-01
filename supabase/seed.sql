-- Seed Data: 41-Day English Upgrade Challenge
-- Dates: 2026-10-31 to 2026-12-10 (41 Days)

do $$
declare
  v_challenge_id uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_phase1_id uuid := 'b0000000-0000-0000-0000-000000000001'::uuid;
  v_phase2_id uuid := 'b0000000-0000-0000-0000-000000000002'::uuid;
  v_phase3_id uuid := 'b0000000-0000-0000-0000-000000000003'::uuid;
  v_phase4_id uuid := 'b0000000-0000-0000-0000-000000000004'::uuid;
  v_phase5_id uuid := 'b0000000-0000-0000-0000-000000000005'::uuid;
  v_phase6_id uuid := 'b0000000-0000-0000-0000-000000000006'::uuid;
begin

  -- 1. Insert Challenge
  insert into public.challenges (
    id, slug, title, description, source_level, target_level, start_date, end_date, total_days, is_published
  ) values (
    v_challenge_id,
    '41-day-english-upgrade',
    '41-Day English Upgrade Challenge',
    'Intensive productive skills challenge targeting B2 fluency and accuracy across 41 structured days.',
    'B1',
    'B2',
    '2026-10-31',
    '2026-12-10',
    41,
    true
  ) on conflict (slug) do update set
    title = excluded.title,
    description = excluded.description,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    total_days = excluded.total_days,
    is_published = excluded.is_published;

  -- 2. Insert 6 Phases
  insert into public.phases (id, challenge_id, phase_number, title, focus, start_day, end_day)
  values
    (v_phase1_id, v_challenge_id, 1, 'Build the habit & baseline', 'Establish daily 30-min routine and baseline speaking/writing samples', 1, 7),
    (v_phase2_id, v_challenge_id, 2, 'Opinions & comparisons', 'Express and justify points of view, comparative structures', 8, 14),
    (v_phase3_id, v_challenge_id, 3, 'Develop and support ideas', 'Cohesion, exemplification, and paragraph extension', 15, 21),
    (v_phase4_id, v_challenge_id, 4, 'Abstract topics & precision', 'Discussing nuance, modal verbs, complex sentences', 22, 28),
    (v_phase5_id, v_challenge_id, 5, 'B2-style extended responses', 'Multi-paragraph arguments, discourse markers, spontaneous fluency', 29, 35),
    (v_phase6_id, v_challenge_id, 6, 'Timed practice & refinement', 'Simulated exam timing, error self-correction, final synthesis', 36, 41)
  on conflict (challenge_id, phase_number) do update set
    title = excluded.title,
    focus = excluded.focus,
    start_day = excluded.start_day,
    end_day = excluded.end_day;

end $$;

-- Populate 41 Days with activities and checklist items
-- Helper function to seed days idempotently
create or replace function public._seed_day(
  p_challenge_slug text,
  p_phase_num integer,
  p_day_num integer,
  p_date date,
  p_title text,
  p_intro text,
  p_spk_prompt text,
  p_spk_instructions text,
  p_wri_prompt text,
  p_wri_instructions text,
  p_wri_target_words integer,
  p_chk_label text
) returns void language plpgsql as $$
declare
  v_c_id uuid;
  v_p_id uuid;
  v_day_id uuid;
begin
  select id into v_c_id from public.challenges where slug = p_challenge_slug;
  select id into v_p_id from public.phases where challenge_id = v_c_id and phase_number = p_phase_num;

  insert into public.challenge_days (challenge_id, phase_id, day_number, scheduled_date, title, intro, is_published)
  values (v_c_id, v_p_id, p_day_num, p_date, p_title, p_intro, true)
  on conflict (challenge_id, day_number) do update set
    phase_id = excluded.phase_id,
    scheduled_date = excluded.scheduled_date,
    title = excluded.title,
    intro = excluded.intro,
    is_published = excluded.is_published
  returning id into v_day_id;

  -- Speaking activity
  insert into public.activities (
    challenge_day_id, activity_type, title, prompt, instructions, target_duration_minutes, sort_order, is_required
  ) values (
    v_day_id, 'speaking', 'Speaking Practice', p_spk_prompt, p_spk_instructions, 15, 1, true
  ) on conflict (challenge_day_id, activity_type) do update set
    prompt = excluded.prompt,
    instructions = excluded.instructions;

  -- Writing activity
  insert into public.activities (
    challenge_day_id, activity_type, title, prompt, instructions, target_duration_minutes, target_word_count, sort_order, is_required
  ) values (
    v_day_id, 'writing', 'Writing Practice', p_wri_prompt, p_wri_instructions, 15, p_wri_target_words, 2, true
  ) on conflict (challenge_day_id, activity_type) do update set
    prompt = excluded.prompt,
    instructions = excluded.instructions,
    target_word_count = excluded.target_word_count;

  -- Checklist item
  delete from public.checklist_items where challenge_day_id = v_day_id;
  insert into public.checklist_items (challenge_day_id, label, sort_order)
  values (v_day_id, p_chk_label, 1);
end;
$$;

-- Phase 1: Build the habit & baseline (Days 1–7)
select public._seed_day(
  '41-day-english-upgrade', 1, 1, '2026-10-31',
  'Day 1: Personal Baseline',
  'Welcome to Day 1! Introduce yourself and establish your starting baseline.',
  'Introduce yourself and explain your current English-learning goal.',
  'Speak continuously; note pauses and repeated words.',
  'Write a 120-word self-introduction for a professional networking event.',
  'Use present simple, present perfect, and clear paragraph structure.',
  120,
  'Use present simple, present perfect, and clear paragraph structure.'
);

select public._seed_day(
  '41-day-english-upgrade', 1, 2, '2026-11-01',
  'Day 2: Daily Routines & Productivity',
  'Examine your daily habits and how you optimize your productive hours.',
  'Describe your morning routine and how it sets the tone for your day.',
  'Focus on sequence markers: first, subsequently, after which, eventually.',
  'Describe your ideal productive day and explain why each part matters.',
  'Include at least three adverbs of frequency and two temporal subordinate clauses.',
  130,
  'Incorporate temporal transitions and varied sentence lengths.'
);

select public._seed_day(
  '41-day-english-upgrade', 1, 3, '2026-11-02',
  'Day 3: Memorable Journeys',
  'Recount a meaningful journey or commute that made an impression.',
  'Talk about a journey you took that did not go as planned.',
  'Use past continuous and past simple to contrast background and key events.',
  'Narrate a travel mishap and explain what you learned from resolving it.',
  'Ensure clear narrative arc: orientation, complication, resolution.',
  130,
  'Check consistent narrative tenses (past simple vs past perfect).'
);

select public._seed_day(
  '41-day-english-upgrade', 1, 4, '2026-11-03',
  'Day 4: Hobbies & Passions',
  'Express your interests with genuine enthusiasm and descriptive vocabulary.',
  'Explain a hobby or skill you enjoy and why you would recommend it to others.',
  'Avoid vague adjectives like good or nice; use engaging descriptors.',
  'Write an article introducing a hobby to beginners, highlighting key benefits.',
  'Structure with a catchy intro, two distinct benefits, and a concluding encouragement.',
  140,
  'Verify topical vocabulary and clear sectional organization.'
);

select public._seed_day(
  '41-day-english-upgrade', 1, 5, '2026-11-04',
  'Day 5: Describing Places',
  'Bring a physical environment to life through sensory details.',
  'Describe a neighborhood or city landmark you know well to an overseas visitor.',
  'Use prepositional phrases and spatial transitions smoothly.',
  'Write a descriptive review of a public space or cafe for an online travel guide.',
  'Integrate sensory details: visual, auditory, and ambiance.',
  140,
  'Ensure sensory description and evocative adjectives.'
);

select public._seed_day(
  '41-day-english-upgrade', 1, 6, '2026-11-05',
  'Day 6: Food & Culture',
  'Explore the connection between culinary traditions and community.',
  'Discuss your favorite traditional dish and the cultural context behind it.',
  'Use descriptive culinary adjectives (savory, aromatic, subtle, hearty).',
  'Explain why food traditions play a crucial role in maintaining cultural identity.',
  'Support your claim with specific examples and cultural insights.',
  140,
  'Use precise culinary and cultural terminology.'
);

select public._seed_day(
  '41-day-english-upgrade', 1, 7, '2026-11-06',
  'Day 7: Week 1 Habit Reflection',
  'Week 1 checkpoint! Review your consistency and reflect on your speaking rhythm.',
  'Reflect on your speaking practice this week. What was easy and what challenged you?',
  'Focus on self-awareness: identify hesitation triggers.',
  'Write a self-evaluation of your first week of practice and two specific adjustments for Week 2.',
  'Categorize by strengths, friction points, and concrete next actions.',
  150,
  'Include concrete reflection evidence and target commitments.'
);

-- Phase 2: Opinions & comparisons (Days 8–14)
select public._seed_day(
  '41-day-english-upgrade', 2, 8, '2026-11-07',
  'Day 8: Remote Work vs In-Office',
  'Weigh the advantages and drawbacks of modern work arrangements.',
  'Compare working from home with working in an office environment.',
  'Use comparative structures: whereas, while on the other hand, in contrast.',
  'Write a balanced opinion essay on whether hybrid work offers the ideal compromise.',
  'Present two perspectives before asserting your reasoned conclusion.',
  150,
  'Use comparison linkers: whereas, in comparison to, conversely.'
);

select public._seed_day(
  '41-day-english-upgrade', 2, 9, '2026-11-08',
  'Day 9: Traditional Books vs Digital Reading',
  'Analyze how reading habits have shifted in the digital era.',
  'Express your preference between printed physical books and digital e-readers.',
  'Justify your preference with sensory, practical, and cognitive points.',
  'Argue whether printed books will ever become completely obsolete.',
  'Use concession phrases: although, despite the rise of, nevertheless.',
  150,
  'Demonstrate concession structures and clear thesis positioning.'
);

select public._seed_day(
  '41-day-english-upgrade', 2, 10, '2026-11-09',
  'Day 10: Online Shopping vs Retail Stores',
  'Evaluate customer experience across online and physical retail.',
  'Discuss how e-commerce has changed the way consumers make purchasing decisions.',
  'Incorporate hedging language: tends to, generally speaking, in many cases.',
  'Evaluate whether physical shopping malls can survive without experiential attractions.',
  'Structure into economic factors, social aspects, and consumer psychology.',
  150,
  'Employ hedging and nuanced generalizations.'
);

select public._seed_day(
  '41-day-english-upgrade', 2, 11, '2026-11-10',
  'Day 11: Public Transit vs Personal Vehicles',
  'Discuss urban mobility, sustainability, and personal freedom.',
  'Propose two measures to encourage commuters to choose public transit over personal cars.',
  'Use modal verbs of recommendation: should consider, ought to implement.',
  'Write an opinion letter to a local city council advocating for improved bike lanes.',
  'Adopt a polite yet persuasive professional tone with clear justifications.',
  150,
  'Maintain formal, persuasive register and constructive proposals.'
);

select public._seed_day(
  '41-day-english-upgrade', 2, 12, '2026-11-11',
  'Day 12: Big City vs Small Town Living',
  'Contemplate pace of life, community connections, and career opportunities.',
  'Describe the lifestyle differences between residing in a metropolis versus a rural town.',
  'Use parallel structures: not only... but also, either... or.',
  'Write a comparative analysis of career prospects versus well-being in large cities.',
  'Weigh economic opportunities against quality of life and mental health.',
  150,
  'Ensure balanced paragraphing and parallel grammatical clauses.'
);

select public._seed_day(
  '41-day-english-upgrade', 2, 13, '2026-11-12',
  'Day 13: Education: Practical Skills vs Theory',
  'Debate the fundamental purpose of higher education institutions.',
  'Should university curricula focus more on vocational skills or academic theory?',
  'Support assertions with hypothetical scenarios: if institutions prioritized...',
  'Write an editorial discussing whether universities adequately prepare graduates for the modern workforce.',
  'Provide balanced evidence from student and employer viewpoints.',
  160,
  'Support claims with concrete hypothetical or real-world examples.'
);

select public._seed_day(
  '41-day-english-upgrade', 2, 14, '2026-11-13',
  'Day 14: Week 2 Opinion Synthesis & Review',
  'Week 2 checkpoint! Consolidate your comparative reasoning and stance-taking.',
  'Summarize the most compelling argument you formed this week and explain why it convinced you.',
  'Focus on cohesive flow and confident vocal projection.',
  'Write a weekly reflection analyzing how your ability to express nuanced viewpoints has evolved.',
  'Cite specific comparative linkers and sentence structures practiced.',
  160,
  'Reflect on discourse markers and comparative vocabulary used.'
);

-- Phase 3: Develop and support ideas (Days 15–21)
select public._seed_day(
  '41-day-english-upgrade', 3, 15, '2026-11-14',
  'Day 15: Environmental Initiatives',
  'Formulate proactive solutions for neighborhood environmental sustainability.',
  'Propose a practical initiative to reduce single-use plastic in your neighborhood.',
  'Structure with cause, effect, and practical remedy.',
  'Write a proposal for a workplace or community zero-waste recycling program.',
  'Detail objectives, implementation stages, and anticipated hurdles.',
  160,
  'Use problem-solution organizational framework.'
);

select public._seed_day(
  '41-day-english-upgrade', 3, 16, '2026-11-15',
  'Day 16: Technology and Human Connection',
  'Critique how algorithmic feeds and social apps influence genuine relationships.',
  'Do smartphone notifications enhance or undermine meaningful social presence?',
  'Use conditional sentences (second and third conditionals) to analyze impact.',
  'Write an essay analyzing how social networking platforms alter interpersonal empathy.',
  'Include counterarguments and address them thoughtfully.',
  160,
  'Formulate and refute a counterargument with poise.'
);

select public._seed_day(
  '41-day-english-upgrade', 3, 17, '2026-11-16',
  'Day 17: Health, Nutrition & Wellness',
  'Examine societal responsibility versus individual autonomy in public health.',
  'Discuss the obstacles people face when attempting to maintain balanced nutritional habits.',
  'Use complex cause-and-effect transitions: consequently, owing to, as a result of.',
  'Argue whether governments should levy special taxes on ultra-processed sugary beverages.',
  'Present economic, ethical, and public health arguments clearly.',
  165,
  'Exemplify points with cause-and-effect connectors.'
);

select public._seed_day(
  '41-day-english-upgrade', 3, 18, '2026-11-17',
  'Day 18: Lifelong Learning & Adaptability',
  'Reflect on career longevity in a rapidly evolving technological climate.',
  'Explain why continuous upskilling is now mandatory rather than optional.',
  'Give personal examples demonstrating professional or academic adaptability.',
  'Write a personal statement detailing an instance where you rapidly mastered a new competence.',
  'Use evocative action verbs and quantify outcomes where possible.',
  165,
  'Utilize strong action verbs and quantified impact.'
);

select public._seed_day(
  '41-day-english-upgrade', 3, 19, '2026-11-18',
  'Day 19: Arts & Creative Expression',
  'Defend the civic and individual value of cultural funding in society.',
  'Defend why arts education remains as crucial as STEM disciplines in schools.',
  'Use persuasive rhetorical questioning and emphatic sentence inversion.',
  'Write an open letter defending the public funding of municipal art galleries and museums.',
  'Articulate intangible societal dividends: inspiration, unity, historic preservation.',
  165,
  'Demonstrate emphatic structures (e.g. Not only does art...).'
);

select public._seed_day(
  '41-day-english-upgrade', 3, 20, '2026-11-19',
  'Day 20: Tourism: Economic Gains vs Local Impact',
  'Deconstruct the complex trade-offs of mass global tourism on heritage sites.',
  'Explain how overtourism affects the day-to-day lives of permanent residents in popular destinations.',
  'Express subtle degrees of certainty: undoubtedly, plausibly, marginally.',
  'Write a balanced report recommending sustainable tourism guidelines for a historic town.',
  'Divide into ecological, residential, and economic action items.',
  170,
  'Calibrate degrees of certainty and modal precision.'
);

select public._seed_day(
  '41-day-english-upgrade', 3, 21, '2026-11-20',
  'Day 21: Week 3 Midpoint Synthesis',
  'Week 3 milestone! Take stock of your ability to build extended paragraphs.',
  'Deliver a spontaneous 3-minute talk synthesizing your growth across the first 20 days.',
  'Aim for seamless linking between ideas without long filler pauses.',
  'Write a comprehensive mid-challenge reflection assessing your grammatical accuracy and vocabulary range.',
  'Compare your Day 1 baseline writing with your recent Day 18–20 pieces.',
  170,
  'Perform critical comparative self-analysis of written cohesion.'
);

-- Phase 4: Abstract topics & precision (Days 22–28)
select public._seed_day(
  '41-day-english-upgrade', 4, 22, '2026-11-21',
  'Day 22: Artificial Intelligence & Ethics',
  'Engage with ethical frontiers in machine decision-making and creative generation.',
  'Discuss whether generative AI tools pose greater creative liberation or intellectual risk.',
  'Use sophisticated evaluative vocabulary: nuance, paradigm, accountability, bias.',
  'Write an argumentative essay on the ethical boundaries of AI in academic assessments.',
  'Establish a rigorous thesis statement supported by two distinct argumentative pillars.',
  170,
  'Incorporate B2 academic vocabulary and tight thesis framing.'
);

select public._seed_day(
  '41-day-english-upgrade', 4, 23, '2026-11-22',
  'Day 23: The Concept of Success',
  'Re-evaluate societal definitions of achievement versus personal fulfillment.',
  'How has your personal definition of genuine success changed over the past five years?',
  'Employ abstract nouns: fulfillment, resilience, autonomy, equilibrium.',
  'Write a philosophical reflection on why conventional metrics like wealth often fail to signify well-being.',
  'Develop coherent transitions between abstract philosophy and relatable human experiences.',
  175,
  'Balance conceptual abstract ideas with grounded illustrations.'
);

select public._seed_day(
  '41-day-english-upgrade', 4, 24, '2026-11-23',
  'Day 24: Privacy in the Digital Age',
  'Scrutinize the unspoken trade-off between modern convenience and surveillance.',
  'Do you feel internet users surrender too much personal data in exchange for free digital services?',
  'Use passive voice constructions strategically to shift focus: data is harvested, rights are eroded.',
  'Write a formal opinion piece assessing whether complete digital privacy is an illusion today.',
  'Analyze commercial tracking versus state regulation with authoritative reasoning.',
  175,
  'Demonstrate intentional use of active and passive voice.'
);

select public._seed_day(
  '41-day-english-upgrade', 4, 25, '2026-11-24',
  'Day 25: Globalization vs Cultural Homogenization',
  'Investigate whether global interconnectedness enriches or erases local heritage.',
  'Talk about how global media influences local fashion, language, and youth culture.',
  'Use concession adverbs: admittedly, nevertheless, concurrently.',
  'Write an analytical essay investigating whether globalization inevitable erodes indigenous customs.',
  'Examine the counter-phenomenon of cultural hybridization.',
  175,
  'Employ sophisticated concession and counterpoint adverbs.'
);

select public._seed_day(
  '41-day-english-upgrade', 4, 26, '2026-11-25',
  'Day 26: Risk-Taking & Failure',
  'Reflect on constructive setbacks as an indispensable catalyst for growth.',
  'Share a personal or observed failure that ultimately yielded an invaluable life lesson.',
  'Use narrative tense mastery: past perfect simple and continuous to sequence prior insights.',
  'Write an essay explaining why cultivating psychological safety around failure fosters innovation.',
  'Support with business or scientific case scenarios.',
  180,
  'Ensure precise tense shifting when framing past outcomes.'
);

select public._seed_day(
  '41-day-english-upgrade', 4, 27, '2026-11-26',
  'Day 27: Media Literacy & Misinformation',
  'Evaluate critical thinking in navigating conflicting information streams.',
  'Explain strategies an everyday news consumer should employ to verify breaking claims.',
  'Use modal verbs of deduction: must indicate, cannot be verified, might imply.',
  'Write an informational guide outlining five crucial steps to discern disinformation online.',
  'Maintain an informative, authoritative, and actionable pedagogical tone.',
  180,
  'Demonstrate modals of deduction and critical appraisal.'
);

select public._seed_day(
  '41-day-english-upgrade', 4, 28, '2026-11-27',
  'Day 28: Week 4 Precision Review',
  'Week 4 checkpoint! Test your lexical precision and ability to discuss complex topics.',
  'Summarize the most abstract idea discussed this week with concise, crystal-clear articulation.',
  'Eliminate filler pauses (um, like) by practicing comfortable pauses.',
  'Write a weekly assessment evaluating your vocabulary variety and sentence complexity.',
  'Select three sentence structures you mastered and highlight their value.',
  180,
  'Review lexical variation (avoid repeated terminology).'
);

-- Phase 5: B2-style extended responses (Days 29–35)
select public._seed_day(
  '41-day-english-upgrade', 5, 29, '2026-11-28',
  'Day 29: Sustainable Cities of Tomorrow',
  'Design an imaginative vision for carbon-neutral, human-centric urban design.',
  'Describe how green infrastructure and renewable energy will reshape future metropolitan hubs.',
  'Use future perfect and future continuous: cities will have adapted, societies will be transitioning.',
  'Write a structured B2 vision paper on the architectural and social characteristics of sustainable cities.',
  'Organize under transportation, energy architecture, and civic spaces.',
  185,
  'Utilize advanced future time clauses and projections.'
);

select public._seed_day(
  '41-day-english-upgrade', 5, 30, '2026-11-29',
  'Day 30: Consumerism & Minimalist Living',
  'Contrast materialistic satisfaction with intentional, sustainable minimalism.',
  'Discuss why minimalist philosophies have gained widespread momentum in recent years.',
  'Use discourse linkers: in light of this, correspondingly, taking this into account.',
  'Write a persuasive article examining whether downscaling possessions leads to authentic tranquility.',
  'Incorporate psychological perspectives alongside ecological considerations.',
  185,
  'Integrate complex discourse linkers across paragraphs.'
);

select public._seed_day(
  '41-day-english-upgrade', 5, 31, '2026-11-30',
  'Day 31: Space Exploration & Resource Allocation',
  'Debate funding priorities between cosmic exploration and urgent domestic issues.',
  'Should billions be invested in interplanetary missions while pressing earthly challenges remain?',
  'Employ diplomatic framing: While one cannot dispute the scientific value, it is equally true that...',
  'Write an argumentative essay evaluating whether public investment in space technology is justifiable.',
  'Present technological spin-offs versus immediate terrestrial urgency.',
  190,
  'Practice diplomatic balance and multi-faceted rebuttal.'
);

select public._seed_day(
  '41-day-english-upgrade', 5, 32, '2026-12-01',
  'Day 32: The Future of Books, Media & Journalism',
  'Analyze the survival of investigative reporting amidst subscription fatigue.',
  'How has decentralized social media journalism disrupted traditional editorial gatekeeping?',
  'Demonstrate nominalization: the proliferation of, the commodification of, the erosion of.',
  'Write an editorial discussing whether independent journalism can survive without state subsidies.',
  'Balance editorial independence against commercial insolvency risks.',
  190,
  'Utilize nominalization to elevate writing register.'
);

select public._seed_day(
  '41-day-english-upgrade', 5, 33, '2026-12-02',
  'Day 33: Leadership & Collective Responsibility',
  'Define the quintessential qualities of effective modern leadership.',
  'What separates a merely competent manager from an genuinely inspirational leader?',
  'Use qualifying adverbs: decisively, fundamentally, empathetically, rigorously.',
  'Write a leadership essay defining the balance between decisive authority and empathetic inclusion.',
  'Cite historical or organizational examples to validate your assertions.',
  190,
  'Verify strong topic sentences and seamless paragraph hooks.'
);

select public._seed_day(
  '41-day-english-upgrade', 5, 34, '2026-12-03',
  'Day 34: Global Languages & Linguistic Diversity',
  'Explore English as a global lingua franca alongside the safeguarding of endangered dialects.',
  'Does the global dominance of English threaten linguistic diversity or foster universal collaboration?',
  'Weigh contradictory truths using balanced correlative expressions.',
  'Write an essay discussing whether international communication demands a common tongue at the expense of regional idioms.',
  'Provide cultural and sociolinguistic considerations.',
  195,
  'Ensure consistent academic tone and objective stance.'
);

select public._seed_day(
  '41-day-english-upgrade', 5, 35, '2026-12-04',
  'Day 35: Week 5 Extended Fluency Review',
  'Week 5 checkpoint! Assess your stamina in maintaining coherent, extended discourse.',
  'Deliver a comprehensive 4-minute spoken synthesis arguing a complex global stance without pausing to translate.',
  'Maintain steady cadence, vocal inflection, and confident flow.',
  'Write an extended reflection examining your transition from B1 fragmented phrases to B2 connected discourse.',
  'Identify remaining grammatical blind spots to tackle in the final timed phase.',
  195,
  'Highlight self-detected errors and their corresponding corrections.'
);

-- Phase 6: Timed practice & refinement (Days 36–41)
select public._seed_day(
  '41-day-english-upgrade', 6, 36, '2026-12-05',
  'Day 36: Timed Challenge: Social Change',
  'Enter timed conditions: synthesize prompt and speak within strict intervals.',
  'Speak on how individual grassroots movements catalyze systemic legislative reform (2 min prep, 3 min speak).',
  'Practice immediate mental outlining using 3 key keywords.',
  'Write a timed 200-word response analyzing the role of youth activism in climate policy within 15 minutes.',
  'Draft directly without pre-translating. Prioritize coherence and complete sentences.',
  200,
  'Verify complete response generated strictly within the 15-minute window.'
);

select public._seed_day(
  '41-day-english-upgrade', 6, 37, '2026-12-06',
  'Day 37: Timed Challenge: Work-Life Boundaries',
  'Practice rapid stance formulation on digital tethering and workplace burnout.',
  'Should employers be legally prohibited from contacting staff outside contractual hours? (Timed spontaneous response).',
  'Focus on immediate thesis statement followed by two clear rationales.',
  'Write a 200-word response on the "Right to Disconnect" and its implications for modern productivity.',
  'Balance employee mental health against global cross-timezone coordination needs.',
  200,
  'Check for well-defined topic sentence and two supporting paragraphs.'
);

select public._seed_day(
  '41-day-english-upgrade', 6, 38, '2026-12-07',
  'Day 38: Error Eradication & Self-Correction',
  'Zero in on recurring personal grammar slips (articles, prepositions, agreement).',
  'Talk about a complex project you oversaw, focusing deliberately on flawless subject-verb and tense agreement.',
  'Notice when you make a slip and practice graceful immediate self-correction.',
  'Write an analytical review of a product or service, paying forensic attention to count/non-count nouns and articles (a/an/the).',
  'Proofread specifically for article omissions and preposition accuracy.',
  200,
  'Conduct systematic proofreading for article and preposition accuracy.'
);

select public._seed_day(
  '41-day-english-upgrade', 6, 39, '2026-12-08',
  'Day 39: Spontaneous Discourse & Nuance',
  'Handle unexpected prompts with quick lexical retrieval and structural composure.',
  'Pick an unexpected daily object (e.g., a clock, an umbrella) and speak metaphorically about its significance in human life.',
  'Embrace creative thinking; link the physical object to deeper existential ideas.',
  'Write an imaginative essay on how everyday tools reflect human psychology and civilizational development.',
  'Showcase fluid transitions, lexical agility, and cohesive paragraph design.',
  200,
  'Ensure seamless transitions between figurative and literal ideas.'
);

select public._seed_day(
  '41-day-english-upgrade', 6, 40, '2026-12-09',
  'Day 40: The Penultimate Synthesis',
  'Final preparation run before the challenge conclusion. Full confidence and poise.',
  'Summarize your entire 40-day journey: the habit formed, your biggest linguistic breakthrough, and your new standard.',
  'Speak with authority, natural pacing, and minimal reliance on notes.',
  'Write a 200-word personal manifesto outlining your English learning strategy for the coming year.',
  'Articulate lifelong maintenance habits: reading, writing, speaking cadence.',
  200,
  'Demonstrate polished B2 syntax, cohesive devices, and ambitious vocabulary.'
);

select public._seed_day(
  '41-day-english-upgrade', 6, 41, '2026-12-10',
  'Day 41: Final Challenge & Grand Comparison',
  'Congratulations on reaching Day 41! Complete the final speaking and writing benchmarks and celebrate your journey.',
  'Record your final benchmark speaking sample: Re-answer Day 1 prompt ("Introduce yourself and your goals") with your full B2 repertoire.',
  'Reflect on your fluency, intonation, pause distribution, and sophistication compared to Day 1.',
  'Write your final benchmark essay: Re-write the networking self-introduction with full B2 range and precision.',
  'Apply advanced structures, present perfect continuous, sophisticated modifiers, and impeccable cohesion.',
  200,
  'Conduct the Day 1 vs Day 41 comparative reflection.'
);

-- Clean up temporary seed function
drop function if exists public._seed_day;
