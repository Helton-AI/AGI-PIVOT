import React, { ReactNode } from "react";

export class ErrorBoundary extends React.Component {
    state: { hasError: boolean };
    props!: { children: ReactNode };

    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, info: { componentStack: any }) {
        console.log(error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return "Something went wrong";
        }

        return this.props.children;
    }
}
