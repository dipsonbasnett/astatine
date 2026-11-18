import { Link } from "react-router-dom";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/button-styles";
import { Card } from "@/components/ui/Card";

export default function NotFoundPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="404"
        title="Page not found"
        description="This address does not match a route in the Astatine foundation. No data was affected."
        meta={<Badge>Unknown route</Badge>}
        actions={
          <>
            <Link to="/" className={buttonStyles()}>
              Return to overview
            </Link>
            <Link to="/about" className={buttonStyles({ variant: "secondary" })}>
              About Astatine
            </Link>
          </>
        }
      />
      <Card className="max-w-prose p-6">
        <p className="text-sm leading-6 text-ink-muted">
          Astatine does not upload page history or health data. Preferences and any
          records you created remain in this browser until you delete them.
        </p>
      </Card>
    </div>
  );
}
