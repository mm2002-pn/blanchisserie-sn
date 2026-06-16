import { Colors } from "@/constants/Colors";

/**
 * Renvoie la palette de l'app.
 *
 * Le design n'a qu'un mode "light" abouti — la palette "dark" existe mais
 * n'est pas finalisée (rendu cassé en mode sombre sur Android). On force
 * "light" pour matcher `userInterfaceStyle: "light"` déclaré dans app.json,
 * quel que soit le mode système du device.
 */
export function useThemeColors() {
  return Colors.light;
}
