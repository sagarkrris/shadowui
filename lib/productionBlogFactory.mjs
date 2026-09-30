import { PRODUCTION_WORKSHOPS } from './productionBlogWorkshops.mjs';

export function createProductionChapters(topics) {
  return topics.map((topic, index) => {
    const authored = PRODUCTION_WORKSHOPS[topic.title];
    if (!authored) throw new Error(`Missing production workshop: ${topic.title}`);
    const { walkthrough, example, exercise, quiz, answer, whenToUse, avoid } = authored;
    return {
      ...topic, walkthrough, example, exercise, quiz, answer, whenToUse, avoid,
      practiceProblems: exercise,
      authoredPractice: true,
      title: `${index + 1}. ${topic.title}`,
    };
  });
}

export function createProductionBlog({ id, title, category, sourceUrl, summary, chapters, capstone }) {
  return {
    id, title, category, sourceUrl, summary,
    lessons: chapters.slice(0, 3).map(chapter => chapter.lesson),
    sections: [
      { heading: "Course goal", body: summary },
      { heading: "Production lens", body: "Every chapter connects a technical mechanism to a user-visible contract, a failure boundary, and the evidence needed to operate it safely." },
      { heading: "Example scope", body: "Examples are teaching traces, calculations, and partial configuration fragments, not tested production deployments. Validate version-specific settings and rehearse failure cases in your environment before rollout." },
    ],
    example: chapters.map(chapter => chapter.diagram).join("\n"),
    interviewQuestions: chapters.slice(0, 3).map(chapter => chapter.quiz),
    practice: `Use the six chapters to review a production design, then defend one trade-off and one rollback path.`,
    capstone,
  };
}
