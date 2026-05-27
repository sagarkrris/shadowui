export default function PrivacyPolicy() {
  return (
    <main className="privacyPage">
      <section className="privacyShell">
        <p className="privacyEyebrow">InterviewIQ</p>
        <h1>Privacy Policy</h1>
        <p className="privacyUpdated">Last updated: May 27, 2026</p>

        <p>
          InterviewIQ helps users practice interviews, review resumes, analyze
          preparation gaps, and use AI-assisted coaching workflows. This policy
          explains what information the app uses and how it is handled.
        </p>

        <h2>Information We Process</h2>
        <p>
          The app may process profile details you enter, interview prompts,
          chat messages, resume or job-description text you provide, uploaded
          files, screenshots, microphone input, and camera or file-picker
          content when you choose to use those features.
        </p>

        <h2>How Information Is Used</h2>
        <p>
          Information is used to generate interview practice responses, analyze
          resumes or screenshots, personalize preparation topics, and provide
          app functionality. AI and analysis requests are sent through
          InterviewIQ server routes so API keys are not stored in the Android
          app.
        </p>

        <h2>Permissions</h2>
        <p>
          Microphone access supports voice input. Camera and file access support
          upload-oriented workflows such as screen, image, or document review.
          Internet access is required because the Android app loads the hosted
          InterviewIQ web application.
        </p>

        <h2>Third-Party Services</h2>
        <p>
          InterviewIQ may use Google AI services for generated responses and
          Vercel hosting infrastructure for the web application and server
          routes. These providers process data according to their own terms and
          policies.
        </p>

        <h2>Data Choices</h2>
        <p>
          Do not submit secrets, passwords, proprietary source code, or highly
          sensitive personal information. You can avoid optional microphone,
          camera, upload, and resume features by not granting permissions or not
          submitting those inputs.
        </p>

        <h2>Contact</h2>
        <p>
          For privacy questions or deletion requests, contact the app publisher
          through the support contact listed on the Google Play store listing.
        </p>
      </section>
    </main>
  );
}
