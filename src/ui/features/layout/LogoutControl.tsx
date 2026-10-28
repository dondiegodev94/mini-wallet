import { Button } from "@/ui/components/Button/Button";

type LogoutControlProps = {
  isPending: boolean;
  error: string | null;
  onLogout: () => void;
};

export function LogoutControl({ isPending, error, onLogout }: LogoutControlProps) {
  return (
    <div className="flex items-center gap-3">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button variant="ghost" isLoading={isPending} onClick={onLogout}>
        Cerrar sesión
      </Button>
    </div>
  );
}
