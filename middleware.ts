export { default } from "next-auth/middleware"
import { AuthOptions } from "next-auth";

export const config = {  
  matcher: [
    "/trips",
    "/reservations",
    "/properties",
    "/favorites" 
  ]
};
