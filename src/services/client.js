import { createThirdwebClient } from "thirdweb";

export const client = createThirdwebClient({
    clientId: import.meta.env.VITE_APP_THIRDWEB_CLIENT_ID,
});
