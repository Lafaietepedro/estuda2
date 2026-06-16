export type TopicOption = {
  id: string;
  name: string;
  subjectId: string;
  subjectName: string;
  parentName: string | null;
};

export function topicOptionLabel(topic: TopicOption) {
  const topicName = topic.parentName
    ? `${topic.parentName} > ${topic.name}`
    : topic.name;
  return `${topic.subjectName} - ${topicName}`;
}
