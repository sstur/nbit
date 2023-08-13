import { PLATFORM } from '../../constants';

/**
 * The sole purpose of this function is as a helper when testing that symlink'd
 * modules work correctly. It imports the PLATFORM constant from two directories
 * up which intentionally breaks out of the symlink'd `core` directory.
 */
export function getPlatform() {
  return PLATFORM;
}
