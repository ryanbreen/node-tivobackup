node-tivobackup
===============

A node.js application to backup content off of tivos.

Proposed pipeline:

- [x] Load a configuration file that contains a list of TiVos IPs and the MAK of those TiVos
- [ ] Query the now playing URL for each TiVo to find all shows flagged as 'do not delete'
- [ ] Reconcile that list against local storage to find any unsaved shows
- [ ] Save the unsaved shows to directories and files named based on the TiVo file metadata
- [ ] ??? Run tivodecode, if present, to turn .TiVo files into .mpegs.
