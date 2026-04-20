import { SignIn } from "@clerk/clerk-react"

export default function Login() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f5f5",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "24px"
    }}>
      <SignIn
        routing="path"
        path="/login"
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/dashboard"
      />
      <a href="https://aibia.io" style={{ fontSize: "13px", color: "#888", textDecoration: "none" }}>
        ← Back to aibia.io
      </a>
    </div>
  )
}
