export const PUBLIC_NAVIGATION = [
  { label: 'Learn', description: 'Build understanding, one idea at a time.', items: [
    { title: 'Preparation journey', href: '/prepare', description: 'Five phases with a clear next step', icon: 'route' },
    { title: 'Learning hub', href: '/learn', description: 'Courses, checkpoints and your next step', icon: 'book' },
    { title: 'Backend roadmap', href: '/java/roadmap', description: 'Java, Spring, SQL and system design', icon: 'route' },
    { title: 'Reading paths', href: '/series', description: 'Connected explanations in a useful order', icon: 'layers' },
    { title: 'Interactive labs', href: '/labs', description: 'Change a constraint. See what happens.', icon: 'lab' },
  ] },
  { label: 'Practice', description: 'Turn an explanation into something you can do.', items: [
    { title: 'Repository assessment', href: '/assessments', description: 'A timed two-file Java engineering task', icon: 'code' },
    { title: 'Build a tiny system', href: '/build', description: 'Original Java projects and coding challenges', icon: 'code' },
    { title: 'Symptoms Atlas', href: '/symptoms', description: 'Troubleshooting by symptom', icon: 'pulse' },
    { title: 'Challenges', href: '/detective', description: '5-minute debugging cases', icon: 'search' },
    { title: 'Challenge archive', href: '/weekly', description: 'One focused investigation to work through', icon: 'calendar' },
  ] },
  { label: 'Interview', description: 'Practise explaining the decisions that matter.', items: [
    { title: 'Practice workspace', href: '/practice', description: 'Personalised prep and AI mock interviews', icon: 'chat' },
    { title: 'Senior Java guide', href: '/senior-java-interview', description: 'A focused study path for experienced engineers', icon: 'book' },
    { title: 'System design', href: '/system-design/visual-guide', description: 'Visual walkthroughs and design trade-offs', icon: 'layers' },
    { title: 'HLD solutions', href: '/hld', description: 'Architecture problems, diagrams and worked decisions', icon: 'layers' },
    { title: 'LLD solutions', href: '/lld', description: 'Object design, Java core models and boundary checks', icon: 'code' },
    { title: 'Daily Java practice', href: '/senior-java-interview/daily', description: 'Questions, examples and follow-up drills', icon: 'calendar' },
  ] },
  { label: 'Resources', description: 'Find an answer. Keep the ideas worth revisiting.', items: [
    { title: 'Explore', href: '/explore', description: 'Browse the engineering library', icon: 'search' },
    { title: 'My notebook', href: '/notebook', description: 'Saved notes, reflections and interview answers', icon: 'bookmark' },
    { title: 'The digest', href: '/digest', description: 'Engineering reading digest preview', icon: 'mail' },
    { title: 'Editorial standards', href: '/editorial', description: 'Sources, review and verification limits', icon: 'check' },
  ] },
];

export const DISCOVERY_SHORTCUTS = PUBLIC_NAVIGATION.flatMap(group => group.items.map(item => ({ ...item, type: group.label, category: group.label })));

export function searchDiscovery(records, query = '', type = 'All', limit = 30) {
  const words = String(query).trim().toLowerCase().slice(0, 160).split(/\s+/).filter(Boolean);
  return records.filter(item => {
    const text = `${item.title} ${item.description || ''} ${item.category || ''} ${item.href || ''} ${(item.href || '').replace(/[-/#]/g, ' ')}`.toLowerCase();
    return (type === 'All' || item.type === type) && words.every(word => text.includes(word));
  }).slice(0, limit);
}
