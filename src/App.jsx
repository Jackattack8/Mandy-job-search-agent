import JobPipeline from "./JobPipeline.jsx";

export default function App() {
  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "32px 20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Mandy's Job Search Agent</h1>
      <p style={{ color: "#5f5e5a", marginTop: 0, marginBottom: 24 }}>
        Ranked accounts receivable, revenue cycle, and admin roles, scored against your profile.
      </p>
      <JobPipeline />
    </div>
  );
}
