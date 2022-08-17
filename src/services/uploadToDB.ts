import axios from "axios";
import fs from "fs";
import { SERVER_URL } from "./api";

export const handleUploadToDb = (hiveId: number | void) => {
  const HIVE_ID =
    Number(
      process.argv
        .filter((arg) => (arg.split("=")[0] === "hive" ? arg : null))[0]
        ?.split("=")[1]
    ) ||
    hiveId ||
    101;

  // Mock file location
  const mockDir = __dirname + `/../../mocks/hive_${HIVE_ID}.sql`;

  let mocks: string;
  try {
    mocks = fs.readFileSync(mockDir, "utf8");
  } catch (error) {
    return console.error(`❌ ERROR READING MOCKS.\nError: ${error}`);
  }

  try {
    return axios
      .post(`${SERVER_URL}/upload-mock-to-db`, { mocks_query: mocks })
      .then(() => console.log("✅ UPLOADED SUCCESSFULLY."))
      .catch((error) =>
        console.error(`❌ ERROR UPLOADING MOCKS TO DATABASE.\nError: ${error}`)
      );
  } catch (error) {
    return console.error(
      `❌ ERROR UPLOADING MOCKS TO DATABASE.\nError: ${error}`
    );
  }
};

handleUploadToDb();
