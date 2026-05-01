export default function Contact() {
  return (
    <div className="container narrow">
      <h1>Contact</h1>
      <section className="card prose-card">
        <p>
          This site ships as a <strong>course / portfolio demo</strong>. For
          questions about the build, reach out through your course staff or your
          own project channels.
        </p>
        <p>
          <strong>Email (placeholder):</strong>{" "}
          <a href="mailto:hello@example.com">hello@example.com</a>
        </p>
        <p className="muted-small">
          Replace the mailto with your real address before sharing publicly.
        </p>
      </section>
    </div>
  );
}
