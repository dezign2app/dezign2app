import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "infractx", signingKey:process.env.INNGEST_SIGNING_KEY });
