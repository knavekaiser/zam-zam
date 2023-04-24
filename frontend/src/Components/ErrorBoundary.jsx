import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, reported: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const options = {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({
        err: error.name,
        message: error.message,
        dscr: errorInfo,
        link: window.location.href,
      }),
    };
    fetch("/api/auto-bug-report", options)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "ok") {
          this.reported = true;
        }
      });
    console.log(error, "bug reported");
  }

  render() {
    if (this.state.hasError) {
      return this.props.onError;
    }

    return this.props.children;
  }
}
