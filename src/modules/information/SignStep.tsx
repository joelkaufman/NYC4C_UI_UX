import type { ModuleInstance, StepProps } from '@/domain/types';
import { esignIssues } from '@/domain/validation';
import { SignDocuments } from '@/modules/common/SignDocuments';
import { signDefs } from './esign';

export function issues(_data: unknown, instance: ModuleInstance) {
  // Until the information is (re)submitted, earlier signatures don't count: new documents are prepared from it.
  return esignIssues(instance.dataSubmittedAt ? instance : { ...instance, esigns: {} }, signDefs());
}

/** Last step of Information: sign the documents prepared from the submitted information. */
export function SignStep({ request, instance }: StepProps) {
  return <SignDocuments request={request} instance={instance} defs={signDefs()} />;
}
