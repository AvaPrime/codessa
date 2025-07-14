# 🗃️ Directive: Initialize Codessa Archives

## 📌 Purpose

To initialize and populate the **Codessa Archives**, a centralized repository for legacy projects, prototypes, experiments, and any external codebases intended for integration into the Codessa OS ecosystem.

This directive defines the file structure, ingestion procedure, tagging protocol, and analysis preparation to enable semantic integration.

---

## 🧱 Prerequisites

* Codessa project root structure must be initialized
* `codessa_codex/` directory must exist
* Developer access to all legacy project repositories

---

## 📁 Archive Folder Structure

Create the following directory:

```
/archives/raw_potential/
```

Each legacy project should be copied into a uniquely named subfolder:

```
/archives/raw_potential/[project_name]/
```

Examples:

```
/archives/raw_potential/project_ava_prime/
/archives/raw_potential/dark_forest_simulation/
/archives/raw_potential/legacy_devtools/
```

---

## 🏷️ Project Tagging Protocol

Each project folder must contain a metadata file:

```
project.meta.json
```

### Template:

```json
{
  "name": "Project Ava Prime",
  "description": "Initial cognitive architecture prototype with directive flow engine.",
  "status": "prototype",
  "language": "typescript",
  "created": "2024-03-14",
  "authors": ["Phoenix"],
  "tags": ["agent", "memory", "flow"],
  "estimated_conversion_complexity": "medium"
}
```

---

## 🧪 Analysis Preparation

Once projects are added, prepare for semantic scan using:

```
npx codessa-analyze ./archives/raw_potential/ --out ./codessa_codex/manifests/
```

The `codessa-analyze` tool will generate a manifest for each project detailing:

* Modules and exports
* Function and class usage
* Potential agent candidates
* Existing memory/logging infrastructure

---

## 🧠 Output Destination

Analysis results will be written to:

```
/codessa_codex/manifests/[project_name].manifest.json
```

And referenced in:

```
/codessa_codex/projects/[project_name]/
```

---

## ✅ Success Criteria

* [ ] `archives/raw_potential/` directory exists at the Codessa root level
* [ ] At least one project folder is present within `raw_potential/`
* [ ] Each project folder includes a complete and valid `project.meta.json` metadata file
* [ ] `codessa-analyze` completes successfully with a corresponding `.manifest.json` for each project
* [ ] A subfolder for each project is generated in `/codessa_codex/projects/` with blueprint templates
* [ ] All discovered agents, modules, and capabilities are registered in the system manifest for further integration

---

## 🧾 Follow-Up Directives

* `Create_Codessa_Inquisitor.md`
* `Codessa_Project_Integration_Blueprint_Template.md`
* `Refactor_Project_To_Codessa_Module.md`

> "From the fragments of the past, the realm shall rise anew. Let the Archives be opened."
