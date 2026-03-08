# 007 - CI/CD Race Condition: Version Bump and Changelog

## Error Message
```
To https://github.com/0x414c49/AppDaemon-Studio
 ! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'https://github.com/0x414c49/AppDaemon-Studio'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart.
```

## Root Cause

**Race condition in CI/CD pipeline:**

The original workflow had TWO separate jobs that both pushed to the same branch:

1. **Job 1: `bump-version`**
   - Commits version bump to `config.json`
   - Pushes to main
   - Creates git tag

2. **Job 2: `generate-changelog`** (runs AFTER Job 1)
   - Runs `git checkout` (gets pre-bump state)
   - Commits changelog update to `CHANGELOG.md`
   - Tries to push → **FAILS** because remote now has the version bump commit

**Timeline:**
```
T0: Job 1 starts
T1: Job 1 commits version bump
T2: Job 1 pushes to main ← Remote now has new commit
T3: Job 2 starts (using old checkout from T0)
T4: Job 2 commits changelog
T5: Job 2 tries to push → REJECTED (behind remote)
```

## Solution

**Combine both operations into a SINGLE job with a SINGLE commit:**

```yaml
release:
  steps:
    - name: Get versions
      # Calculate new version
    
    - name: Generate changelog
      # Generate changelog content
    
    - name: Commit version and changelog
      run: |
        # Update config.json
        jq --arg version "$NEW_VERSION" '.version = $version' config.json
        
        # Update CHANGELOG.md
        # ... changelog generation ...
        
        # Commit BOTH changes together
        git add config.json CHANGELOG.md
        git commit -m "chore: release $NEW_TAG"
        git tag "$NEW_TAG"
        git push
        git push --tags
```

**Key changes:**
1. Single job instead of two dependent jobs
2. Single atomic commit with both version and changelog
3. One push operation instead of two

## Benefits

✅ **No race conditions** - All changes in one commit
✅ **Atomic releases** - Version and changelog always in sync
✅ **Cleaner git history** - One commit per release instead of two
✅ **Faster CI/CD** - Eliminates job dependency overhead

## Prevention

When designing CI/CD pipelines:
- ❌ Avoid multiple jobs that push to the same branch
- ✅ Combine related changes into single commits
- ✅ Use atomic operations for release automation
- ✅ If multiple pushes are necessary, always pull before pushing

## Related

- GitHub Actions: [Workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- Git: [Atomic commits](https://www.freshconsulting.com/insights/blog/atomic-commits/)
