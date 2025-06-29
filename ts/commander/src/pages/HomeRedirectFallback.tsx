import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function HomeRedirectFallback() {
    const navigate = useNavigate();

    useEffect(() => {
        // This is just a fallback route; App.tsx handles main routing logic.
        navigate("/onboarding", { replace: true });
    }, []);

    return null;
}
