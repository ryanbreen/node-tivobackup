node-tivobackup
===============

node-tivobackup is a node.js application to backup content off of TiVos.  It is designed to work in conjunction with pyTiVo, generating a directory of curated content in a pyTiVo-compatible fashion.

Proposed pipeline:

- [x] Load a configuration file that contains a list of TiVos IPs and the MAK of those TiVos
- [x] Query the now playing URL for each TiVo to find all shows flagged as Do Not Delete
- [ ] Populate a pyTivo file for each recording
- [ ] Reconcile that list against local storage to find any unsaved shows
- [ ] Save the unsaved shows to directories and files named based on the TiVo file metadata
