node-tivobackup
===============

node-tivobackup is a node.js application to backup content off of TiVos.  It is designed to work in conjunction with pyTiVo, generating a directory of curated content in a pyTiVo-compatible fashion.

Checklist:

- [x] Load a configuration file that contains a list of TiVos IPs and the MAK of those TiVos
- [x] Query the now playing URL for each TiVo to find all shows flagged as Do Not Delete
- [x] Populate a pyTivo file for each recording
- [x] Reconcile that list against local storage to find any unsaved shows
- [x] Save the unsaved shows to directories and files named based on the TiVo file metadata
- [ ] Refuse to download if disk is within 3x recording size
- [ ] Make progress bars sane when multiple recordings are transferring at once
