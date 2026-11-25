import {
  Badge,
  Button,
  Card,
  Flex,
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Stack,
  Text,
  Title,
} from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ReleaseDetails({ subject = {} } = {}) {
  return (
    <Card variant="subtle">
      <Flex align="center" wrap="wrap" gap={16}>
        <Stack gap={4} align="start">
          <Title as="h3" size="body-m">
            Release notes
          </Title>
          <Badge status="success">Published</Badge>
        </Stack>
        <Popover>
          <PopoverTrigger {...subject} asChild>
            <Button variant="secondary">Release details</Button>
          </PopoverTrigger>
          <PopoverContent {...subject} size="s">
            <PopoverHeader>
              <PopoverTitle>Release details</PopoverTitle>
              <PopoverClose />
            </PopoverHeader>
            <PopoverBody>
              <Text size="body-s" dir="auto">
                Published today for everyone in the workspace.
              </Text>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Flex>
    </Card>
  );
}
