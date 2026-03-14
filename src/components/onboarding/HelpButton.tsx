import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import KBDrawer from "./KBDrawer";

const HelpButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        <HelpCircle className="w-5 h-5" strokeWidth={1.5} />
      </Button>
      <KBDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default HelpButton;
