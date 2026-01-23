import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface InstructorCardProps {
  id: string;
  name: string | null;
  image: string | null;
  verified: boolean;
}

export function InstructorCard({
  id,
  name,
  image,
  verified,
}: InstructorCardProps) {
  return (
    <Link href={`/app/profile/instructor/${id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={image || undefined} alt={name || "Instruktor"} />
            <AvatarFallback>
              {name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "I"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 items-center gap-2">
            <span className="font-medium text-sm">{name || "Nepoznati instruktor"}</span>
            {verified && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3" />
                Verificiran
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
