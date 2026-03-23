// Disable parallel execution across test classes — unit tests share the APPS_DIR
// environment variable which is process-global state.
[assembly: Xunit.CollectionBehavior(DisableTestParallelization = true)]
