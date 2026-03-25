import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { UserMutationResolver } from "./src/resolvers/User/UserMutationResolver";
import { OtpMutationResolver } from "./src/resolvers/otp/OtpMutationResolver";
import { AdminMutationResolver } from "./src/resolvers/admin/AdminMutationResolver";
import { PanditMutationResolver } from "./src/resolvers/pandit/PanditMutationResolver";
import { PanditQueryResolver } from "./src/resolvers/pandit/PanditQueryResolver";
import { AminQueryResolver } from "./src/resolvers/admin/AdminQueryResolver";
import { BookingMutationResolver } from "./src/resolvers/booking/BookingMutationResolver";
import { BookingQueryResolver } from "./src/resolvers/booking/BookingQueryResolver";
import { ServiceQueryResolver } from "./src/resolvers/services/ServiceQueryResolver";
import { CategoryQueryResolver } from "./src/resolvers/category/CategoryQueryResolver";
import { UserQueryResolver } from "./src/resolvers/User/UserQueryResolver";
import { CartMutationResolver } from "./src/resolvers/cart/CartMutationResolver";
import { UploadScalar } from "./src/types/scalar/UploadScalar";
import { Upload } from "graphql-upload-minimal";
import Container from "typedi";

buildSchema({
  resolvers: [
    UserMutationResolver,
    OtpMutationResolver,
    AdminMutationResolver,
    PanditMutationResolver,
    PanditQueryResolver,
    AminQueryResolver,
    BookingMutationResolver,
    BookingQueryResolver,
    ServiceQueryResolver,
    CategoryQueryResolver,
    UserQueryResolver,
    CartMutationResolver,
  ],
  container: Container,
  scalarsMap: [{ type: Upload, scalar: UploadScalar }],
  authChecker: () => true,
}).then(() => {
    console.log("Schema Built Successfully")
    process.exit(0);
}).catch(e => {
    console.error(e)
    process.exit(1);
});
