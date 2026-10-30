/**
 * The model registry. One entry per file in this folder, listed by name.
 * Nothing outside src/models/ and tests/ may import from here (see
 * tests/models-registry.test.ts): planned models stay unwired until promoted.
 */
import type { ModelDefinition } from "./common";
import { model as activityEvent } from "./activity-event";
import { model as actor } from "./actor";
import { model as aiSettings } from "./ai-settings";
import { model as asset } from "./asset";
import { model as authorshipEvent } from "./authorship-event";
import { model as brandTemplate } from "./brand-template";
import { model as caseStudy } from "./case-study";
import { model as collaborator } from "./collaborator";
import { model as collection } from "./collection";
import { model as comment } from "./comment";
import { model as credit } from "./credit";
import { model as culturalContext } from "./cultural-context";
import { model as deck } from "./deck";
import { model as flowState } from "./flow-state";
import { model as invitation } from "./invitation";
import { model as layerEffects } from "./layer-effects";
import { model as libraryAsset } from "./library-asset";
import { model as layerRole } from "./layer-role";
import { model as lineageEdge } from "./lineage-edge";
import { model as localeString } from "./locale-string";
import { model as maker } from "./maker";
import { model as shareCard } from "./share-card";
import { model as short } from "./short";
import { model as story } from "./story";
import { model as styleGuide } from "./style-guide";
import { model as tasteProfile } from "./taste-profile";
import { model as usageEvent } from "./usage-event";

export const modelRegistry: ModelDefinition[] = [
  activityEvent,
  actor,
  aiSettings,
  asset,
  authorshipEvent,
  brandTemplate,
  caseStudy,
  collaborator,
  collection,
  comment,
  credit,
  culturalContext,
  deck,
  flowState,
  invitation,
  layerEffects,
  layerRole,
  libraryAsset,
  lineageEdge,
  localeString,
  maker,
  shareCard,
  short,
  story,
  styleGuide,
  tasteProfile,
  usageEvent,
].sort((a, b) => a.name.localeCompare(b.name));

export type { ModelDefinition, ModelStatus, ModelStorage } from "./common";
