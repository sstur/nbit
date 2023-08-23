import { stat } from 'fs/promises';

// This is re-exported here so it can be easily mocked for tests.
export default {
  stat,
};
