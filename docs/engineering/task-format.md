# Codessa Engineering Task Format

A task is the unit of work for an implementation agent.

## Task

Unique identifier, for example `E-001`.

## Objective

One sentence describing the implementation outcome.

## Context

Why the task exists.

## Allowed scope

Files, modules, or interfaces the agent may modify.

## Forbidden scope

Files, modules, branches, specifications, or decisions the agent must not modify.

## Existing contract

Behavior that already exists and must remain valid.

## Required behavior

Behavior the implementation must add.

## Acceptance tests

Tests that must pass.

## Regression tests

Existing tests that must continue passing.

## Failure conditions

Conditions under which the agent must stop rather than improvise.

## Evidence required

The report must contain changed files, test commands, test results, verification result, invariant impact, and limitations.

## Completion

A task is complete only when the implementation exists, acceptance tests pass, regression tests pass, verification passes, the diff is within scope, and the completion report is produced. Passing tests do not authorize a constitutional change.
