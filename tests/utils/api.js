const { default: axios } = require("axios");
const { getUserToken } = require("../../utils/auth");
const { buildUser } = require("./db-utils");

const baseURL = `http://localhost:8080/api`;

const getData = (res) => res.data;

const handleRequestFailure = ({ response: { status, data } }) => {
  const error = new Error(`${status}: ${JSON.stringify(data)}`);
  // remove parts of the stack trace so the error message (codeframe) shows up
  // at the code where the actual problem is.
  error.stack = error.stack
    .split("\n")
    .filter(
      (line) =>
        !line.includes("at handleRequestFailure") &&
        !line.includes("at processTicksAndRejections")
    )
    .join("\n");
  error.status = status;
  error.data = data;
  return Promise.reject(error);
};

exports.setup = async () => {
  const user = await buildUser();

  const authAPI = axios.create({ baseURL });

  authAPI.defaults.headers.common.authorization = `Bearer ${getUserToken(
    user.id
  )}`;

  authAPI.interceptors.response.use(getData, handleRequestFailure);

  return { user, authAPI };
};
