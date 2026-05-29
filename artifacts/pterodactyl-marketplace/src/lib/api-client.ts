import { setAuthTokenGetter } from "@workspace/api-client-react";

setAuthTokenGetter(() => {
  return localStorage.getItem("pterostore_token");
});

export {};
