import "dotenv/config";
import { app } from "./app.js";
import connectToDB from "./db/index.js";

connectToDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at PORT ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("Mongo DB connection failed !! ", error);
  });
