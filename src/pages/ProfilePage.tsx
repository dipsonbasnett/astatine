import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileDetails } from "@/features/hmc/ProfileDetails";

export default function ProfilePage() {
  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Browser-local identity"
        title="Profile"
        description="Your local preferences, mission assignment, and data boundaries. The simulated astronaut is not a representation of your health."
      />
      <ProfileDetails />
    </div>
  );
}
