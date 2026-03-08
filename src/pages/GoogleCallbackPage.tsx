import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const GoogleCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      navigate("/calendario?gcal=error", { replace: true });
      return;
    }

    // Forward the code to the edge function for token exchange
    supabase.functions
      .invoke("google-calendar-callback", {
        body: { code, origin: window.location.origin },
      })
      .then(({ data, error: fnError }) => {
        if (fnError || !data?.success) {
          navigate("/calendario?gcal=error", { replace: true });
        } else {
          navigate("/calendario?gcal=success", { replace: true });
        }
      })
      .catch(() => {
        navigate("/calendario?gcal=error", { replace: true });
      });
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted-foreground">Conectando con Google Calendar...</p>
    </div>
  );
};

export default GoogleCallbackPage;
