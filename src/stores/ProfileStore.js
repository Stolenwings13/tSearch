import {isAlive, resolveIdentifier, types} from 'mobx-state-tree';
import TrackerStore from "./TrackerStore";


/**
 * @typedef {{}} ProfileTrackerMetaStore
 * @property {string|undefined} name
 * @property {string|undefined} author
 * @property {string|undefined} homepageURL
 * @property {string|undefined} trackerURL
 * @property {string|undefined} downloadURL
 */
const ProfileTrackerMetaStore = types.model('ProfileTrackerMetaStore', {
  name: types.maybe(types.string),
  author: types.maybe(types.string),
  homepageURL: types.maybe(types.string),
  trackerURL: types.maybe(types.string),
  downloadURL: types.maybe(types.string),
});

/**
 * @typedef {{}} ProfileTrackerStore
 * @property {string} id
 * @property {ProfileTrackerMetaStore} [meta]
 * @property {*} tracker
 */
const ProfileTrackerStore = types.model('ProfileTrackerStore', {
  id: types.string,
  meta: types.optional(ProfileTrackerMetaStore, {}),
}).views(self => {
  return {
    get tracker() {
      if (isAlive(self)) {
        return resolveIdentifier(TrackerStore, self, self.id);
      }
    }
  };
});


/**
 * @typedef {{}} ProfileStore
 * @property {string} id
 * @property {string} name
 * @property {ProfileTrackerStore[]} trackers
 * @property {*} trackersIsReady
 */
const ProfileStore = types.model('ProfileStore', {
  id: types.identifier,
  name: types.string,
  trackers: types.array(ProfileTrackerStore)
});

export default ProfileStore;
export {ProfileTrackerStore};