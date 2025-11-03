import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
type ToasterProps = React.ComponentProps<typeof Sonner>;
const Toaster = ({
  ...props
}: ToasterProps) => {
  const {
    theme = "system"
  } = useTheme();
  return;
};
export { Toaster, toast };